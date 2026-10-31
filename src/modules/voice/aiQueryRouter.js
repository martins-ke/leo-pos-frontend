import { api } from '../../api/api.js';
import { normalizeBusinessSpeech } from './voiceGrammar.js';

function getShopId(context = {}) {
  return context.activeShopId || context.selectedShopId || localStorage.getItem('leo_active_shop') || '';
}

function formatMoney(value) {
  const num = Number(value || 0);
  return `KES ${num.toLocaleString()}`;
}

function getDateKey(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function asDayName(dateValue) {
  const d = new Date(dateValue);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function buildAiQueryPlan(question, context = {}) {
  const normalized = normalizeBusinessSpeech(question || '');
  const q = normalized.toLowerCase();

  if (!q) return null;

  if (/(sales|revenue|income|profit).*(today|now|this day)|today.*(sales|revenue|income|profit)|^sales$|^cells$|^sells$/.test(q)) {
    return { type: 'dashboard-summary', endpoint: '/dashboard/summary', params: { shopId: getShopId(context) }, label: 'today sales' };
  }

  if (/(compare|vs|versus).*(sales|revenue|income)|sales.*(compare|vs|versus)|monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(q)) {
    return { type: 'sales-comparison', endpoint: '/sales', params: { shopId: getShopId(context) }, label: 'sales comparison' };
  }

  if (/(top products|best selling|best seller|most sold|products sold the most|popular products)/.test(q)) {
    return { type: 'top-products', endpoint: '/sales', params: { shopId: getShopId(context) }, label: 'best sellers' };
  }

  if (/(stock left|how much stock|remaining stock|inventory|stock.*(left|available)|products.*stock|available stock)/.test(q)) {
    return { type: 'inventory-stock', endpoint: '/products', params: { shopId: getShopId(context) }, label: 'stock status' };
  }

  if (/(low stock|stock alert|restock|depletion|running low)/.test(q)) {
    return { type: 'low-stock', endpoint: '/products', params: { shopId: getShopId(context) }, label: 'low stock alert' };
  }

  if (/(cash|account balance|shop balance|balance|net profit|profit)/.test(q)) {
    return { type: 'account-summary', endpoint: `/accounts/${encodeURIComponent(getShopId(context) || '')}/summary`, params: {}, label: 'shop balance' };
  }

  if (/(expenses|spending|costs|operating expense)/.test(q)) {
    return { type: 'expenses', endpoint: '/expenses', params: { shopId: getShopId(context) }, label: 'expenses' };
  }

  if (/(customers|clients|walk-ins|customer list)/.test(q)) {
    return { type: 'customers', endpoint: '/customers', params: { shopId: getShopId(context), page: 0, size: 50 }, label: 'customers' };
  }

  if (/(staff|cashier|employees|team)/.test(q)) {
    return { type: 'staff', endpoint: '/staff', params: {}, label: 'staff' };
  }

  if (/(shops|outlets|branches|stores)/.test(q)) {
    return { type: 'shops', endpoint: '/shops', params: {}, label: 'outlets' };
  }

  if (/(inventory.*withdraw|withdrawals|stock.*used|personal use)/.test(q)) {
    return { type: 'inventory-withdrawals', endpoint: '/inventory/withdrawals', params: { shopId: getShopId(context), page: 0, size: 25 }, label: 'stock withdrawals' };
  }

  return null;
}

export async function executeAiBusinessQuery(question, context = {}) {
  const plan = buildAiQueryPlan(question, context);
  if (!plan) {
    return null;
  }

  try {
    const shopId = getShopId(context);

    if (plan.type === 'dashboard-summary') {
      const res = await api.get(plan.endpoint + (shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''));
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch the sales summary right now.', chime: 'warning' };
      }
      const revenue = Number(res.body.todayRevenue || 0);
      const profit = Number(res.body.todayGrossProfit || 0);
      const salesCount = Number(res.body.totalSalesToday || 0);
      return {
        answer: `Today's sales total is ${formatMoney(revenue)} across ${salesCount} sales. Gross profit is ${formatMoney(profit)}.`,
        chime: 'success',
      };
    }

    if (plan.type === 'sales-comparison') {
      const res = await api.get(`${plan.endpoint}?shopId=${encodeURIComponent(shopId)}`);
      if (!res.success || !res.body) {
        return { answer: 'I could not compare sales for those dates right now.', chime: 'warning' };
      }

      const sales = Array.isArray(res.body) ? res.body : (res.body.content || []);
      const dayTarget = /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test((question || '').toLowerCase())
        ? (question || '').toLowerCase().match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/)[0]
        : null;

      const totalsByDay = {};
      for (const sale of sales) {
        const key = asDayName(sale.createdAt || sale.created_at || new Date());
        if (!key) continue;
        totalsByDay[key] = (totalsByDay[key] || 0) + Number(sale.grandTotal || sale.total || 0);
      }

      if (dayTarget) {
        const dayLabel = dayTarget.charAt(0).toUpperCase() + dayTarget.slice(1);
        const total = totalsByDay[dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)] || 0;
        return { answer: `${dayLabel} sales were ${formatMoney(total)}.`, chime: 'success' };
      }

      const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const comparison = weekdayNames.map(name => ({ name, total: totalsByDay[name] || 0 }));
      const first = comparison.find(item => item.total > 0) || comparison[0] || { name: 'This week', total: 0 };
      const best = comparison.reduce((winner, current) => current.total > winner.total ? current : winner, { name: 'No data', total: 0 });
      return {
        answer: `The strongest sales day so far is ${best.name} with ${formatMoney(best.total)}. ${first.name} is the first day with recorded sales.`,
        chime: 'success',
      };
    }

    if (plan.type === 'top-products') {
      const res = await api.get(`${plan.endpoint}?shopId=${encodeURIComponent(shopId)}`);
      if (!res.success || !res.body) {
        return { answer: 'I could not determine the best-selling products right now.', chime: 'warning' };
      }

      const sales = Array.isArray(res.body) ? res.body : (res.body.content || []);
      const totals = {};
      for (const sale of sales) {
        const items = sale.items || [];
        for (const item of items) {
          const productName = item.productName || item.name || 'Unknown product';
          const value = Number(item.subtotal || item.total || (item.quantity || 0) * (item.unitPrice || 0));
          totals[productName] = (totals[productName] || 0) + value;
        }
      }

      const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      if (!best) {
        return { answer: 'There are no recorded sales yet to rank products.', chime: 'warning' };
      }
      return { answer: `The best-selling product is ${best[0]} with ${formatMoney(best[1])} in sales.`, chime: 'success' };
    }

    if (plan.type === 'inventory-stock') {
      const res = await api.get(plan.endpoint + (shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''));
      if (!res.success || !res.body) {
        return { answer: 'I could not read the stock levels right now.', chime: 'warning' };
      }
      const rows = Array.isArray(res.body) ? res.body : (res.body.content || res.body.items || []);
      const totalQty = rows.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
      const lowStock = rows.filter(product => Number(product.quantity || 0) <= Number(product.minStockLevel || product.min_stock_level || 0)).slice(0, 3);
      const itemsText = lowStock.length ? `Low stock includes ${lowStock.map(item => `${item.name} (${item.quantity})`).join(', ')}.` : 'All tracked items are currently above their minimum stock levels.';
      return { answer: `We currently have ${totalQty} units across the active catalog. ${itemsText}`, chime: 'success' };
    }

    if (plan.type === 'low-stock') {
      const res = await api.get(plan.endpoint + (shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''));
      if (!res.success || !res.body) {
        return { answer: 'I could not check low-stock alerts right now.', chime: 'warning' };
      }
      const rows = Array.isArray(res.body) ? res.body : (res.body.content || res.body.items || []);
      const lowStock = rows.filter(product => Number(product.quantity || 0) <= Number(product.minStockLevel || product.min_stock_level || 0));
      if (!lowStock.length) {
        return { answer: 'There are no low-stock alerts right now.', chime: 'success' };
      }
      const summary = lowStock.slice(0, 5).map(item => `${item.name} (${item.quantity})`).join(', ');
      return { answer: `Low-stock items: ${summary}.`, chime: 'warning' };
    }

    if (plan.type === 'account-summary') {
      if (!shopId) {
        return { answer: 'Please select a shop before asking for the account balance.', chime: 'warning' };
      }
      const res = await api.get(`/accounts/${encodeURIComponent(shopId)}/summary`);
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch the shop account balance right now.', chime: 'warning' };
      }
      const balance = Number(res.body.accountBalance || 0);
      const netProfit = Number(res.body.netProfit || 0);
      return { answer: `Shop account balance is ${formatMoney(balance)}. Net profit is ${formatMoney(netProfit)}.`, chime: 'success' };
    }

    if (plan.type === 'expenses') {
      const res = await api.get(`${plan.endpoint}?shopId=${encodeURIComponent(shopId)}&page=0&size=50`);
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch expense records right now.', chime: 'warning' };
      }
      const list = res.body.content || [];
      const total = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return { answer: `Expense records total ${formatMoney(total)} across ${list.length} entries.`, chime: 'success' };
    }

    if (plan.type === 'customers') {
      const res = await api.get(`${plan.endpoint}?shopId=${encodeURIComponent(shopId)}&page=0&size=50`);
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch the customer list right now.', chime: 'warning' };
      }
      const list = res.body.content || [];
      const names = list.slice(0, 3).map(item => item.name || 'Customer').join(', ');
      return { answer: `There are ${list.length} customers in this outlet. Recent customers: ${names || 'none recorded'}.`, chime: 'success' };
    }

    if (plan.type === 'staff') {
      const res = await api.get('/staff');
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch the staff list right now.', chime: 'warning' };
      }
      const list = Array.isArray(res.body) ? res.body : (res.body.content || []);
      const active = list.filter(member => (member.status || '').toUpperCase() === 'ACTIVE').length;
      const names = list.slice(0, 3).map(member => member.username || 'Staff').join(', ');
      return { answer: `${list.length} staff members are registered, with ${active} active. Recent users: ${names || 'none'}.`, chime: 'success' };
    }

    if (plan.type === 'shops') {
      const res = await api.get('/shops');
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch shop outlets right now.', chime: 'warning' };
      }
      const list = Array.isArray(res.body) ? res.body : [];
      const labels = list.map(shop => shop.name || 'shop').join(', ');
      return { answer: `You currently have ${list.length} outlets: ${labels || 'none configured'}.`, chime: 'success' };
    }

    if (plan.type === 'inventory-withdrawals') {
      const res = await api.get(`${plan.endpoint}?shopId=${encodeURIComponent(shopId)}&page=0&size=25`);
      if (!res.success || !res.body) {
        return { answer: 'I could not fetch stock withdrawals right now.', chime: 'warning' };
      }
      const list = res.body.content || [];
      const total = list.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return { answer: `There have been ${list.length} stock withdrawal records totaling ${total} units.`, chime: 'success' };
    }

    return { answer: 'I can help with sales, stock, customers, staff, expenses, and account balances.', chime: 'success' };
  } catch {
    return { answer: 'I hit a connection issue while querying the business data.', chime: 'warning' };
  }
}
