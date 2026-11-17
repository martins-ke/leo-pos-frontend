import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../../api/api';
import { useDelayedLoading } from '../../components/loading/useDelayedLoading';
import { useNavigate } from 'react-router-dom';
import {
  MdTrendingUp, MdStore, MdArrowForward, MdPointOfSale, MdCheckCircle, MdPrint, MdClose
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import { useFeedback } from '../../context/useFeedback';
import { useAuth } from '../../context/useAuth';
import styles from './Dashboard.module.css';

const DASHBOARD_QUERY_OPTIONS = { staleTime: 30_000, retry: false };
const EMPTY_DASHBOARD_DATA = {
  todayRevenue: 0,
  todayGrossProfit: 0,
  monthRevenue: 0,
  monthGrossProfit: 0,
  todayCashCollected: 0,
  todayMpesaCollected: 0,
  todayCardCollected: 0,
  todayBankTransferCollected: 0,
  todayNetProfit: 0,
  monthNetProfit: 0,
  totalSalesToday: 0,
  totalProducts: 0,
  lowStockCount: 0,
  recentSales: [],
  lowStockProducts: [],
};

async function getApiBody(path, errorMessage) {
  const response = await api.get(path, { showLoading: false });
  if (!response.success || response.body == null) {
    throw new Error(response.message || errorMessage);
  }
  return response.body;
}

async function getApiArray(path, errorMessage) {
  const response = await api.get(path, { showLoading: false });
  if (!response.success || !Array.isArray(response.body)) {
    throw new Error(response.message || errorMessage);
  }
  return response.body;
}

function getQueryErrorMessage(error, fallback, connectionMessage) {
  return error instanceof TypeError
    ? connectionMessage
    : error.message || fallback;
}

export default function DashboardPage() {
  const { notify } = useFeedback();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedShopId, setSelectedShopId] = useState('');
  const [viewReceipt, setViewReceipt] = useState(null);
  const [salesTrendRange, setSalesTrendRange] = useState(7);
  const userId = user?.id ?? null;
  const shopQuery = selectedShopId ? `?shopId=${encodeURIComponent(selectedShopId)}` : '';

  const shopsQuery = useQuery({
    queryKey: ['shops', userId],
    queryFn: () => getApiBody('/shops', 'Could not load shops.'),
    ...DASHBOARD_QUERY_OPTIONS,
  });
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'summary', userId, selectedShopId],
    queryFn: () => getApiBody(
      selectedShopId
        ? `/dashboard/summary?shopId=${selectedShopId}`
        : '/dashboard/summary',
      'Could not load dashboard data.',
    ),
    placeholderData: keepPreviousData,
    ...DASHBOARD_QUERY_OPTIONS,
  });
  const salesQuery = useQuery({
    queryKey: ['sales', userId, selectedShopId],
    queryFn: () => getApiArray(`/sales${shopQuery}`, 'Could not load sales trend data.'),
    placeholderData: keepPreviousData,
    ...DASHBOARD_QUERY_OPTIONS,
  });
  const stockProductsQuery = useQuery({
    queryKey: ['products', userId, selectedShopId],
    queryFn: () => getApiArray(`/products${shopQuery}`, 'Could not load stock levels.'),
    placeholderData: keepPreviousData,
    ...DASHBOARD_QUERY_OPTIONS,
  });

  const data = dashboardQuery.data ?? EMPTY_DASHBOARD_DATA;
  const shops = shopsQuery.data ?? [];
  const salesForTrend = salesQuery.data ?? [];
  const stockProducts = stockProductsQuery.data ?? [];

  useEffect(() => {
    if (!shopsQuery.error) return;
    notify({
      type: 'error',
      message: getQueryErrorMessage(
        shopsQuery.error,
        'Could not load shops.',
        'Could not connect to the server while loading shops.',
      ),
    });
  }, [shopsQuery.error, shopsQuery.errorUpdatedAt, notify]);

  useEffect(() => {
    if (!dashboardQuery.error) return;
    notify({
      type: 'error',
      message: getQueryErrorMessage(
        dashboardQuery.error,
        'Could not load dashboard data.',
        'Could not connect to the server while loading dashboard data.',
      ),
    });
  }, [dashboardQuery.error, dashboardQuery.errorUpdatedAt, notify]);

  useEffect(() => {
    const errors = [
      salesQuery.error,
      stockProductsQuery.error,
    ].filter(Boolean);
    if (errors.length === 0) return;

    if (errors.some(error => error instanceof TypeError)) {
      notify({
        type: 'error',
        message: 'Could not connect to the server while loading sales and stock data.',
      });
      return;
    }

    errors.forEach(error => {
      notify({ type: 'error', message: error.message });
    });
  }, [
    salesQuery.error,
    salesQuery.errorUpdatedAt,
    stockProductsQuery.error,
    stockProductsQuery.errorUpdatedAt,
    notify,
  ]);

  const salesTrend = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: salesTrendRange }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - salesTrendRange + index + 1);
      return {
        date,
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        total: 0,
      };
    });
    const totalsByDay = new Map(days.map(day => [day.key, day]));

    salesForTrend.forEach(sale => {
      const date = new Date(sale.createdAt);
      const amount = Number(sale.grandTotal);
      if (!Number.isFinite(date.getTime()) || !Number.isFinite(amount)) return;
      const day = totalsByDay.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      if (day) day.total += amount;
    });

    const maxTotal = Math.max(0, ...days.map(day => day.total));
    const chartMax = maxTotal || 1;
    const chartPoints = days.map((day, index) => ({
      ...day,
      x: 40 + (index * 650) / Math.max(days.length - 1, 1),
      y: 174 - (day.total / chartMax) * 146,
    }));
    const linePath = chartPoints.map(point => `${point.x},${point.y}`).join(' ');
    const areaPath = chartPoints.length
      ? `M ${chartPoints[0].x},174 L ${chartPoints.map(point => `${point.x},${point.y}`).join(' L ')} L ${chartPoints[chartPoints.length - 1].x},174 Z`
      : '';
    const labelStep = salesTrendRange === 7 ? 1 : 6;
    const labels = chartPoints.filter((_, index) => index % labelStep === 0 || index === chartPoints.length - 1);

    return { chartPoints, areaPath, linePath, labels, maxTotal, chartMax };
  }, [salesForTrend, salesTrendRange]);

  const topSellingStock = useMemo(() => {
    const stockByProduct = new Map();
    stockProducts.forEach(product => {
      const name = String(product.name || '').trim();
      const key = name.toLocaleLowerCase();
      if (!key) return;

      const existing = stockByProduct.get(key) || {
        name,
        quantity: 0,
        minStockLevel: 0,
        units: new Set(),
      };
      existing.quantity += Number(product.quantity) || 0;
      existing.minStockLevel += Number(product.min_stock_level ?? product.minStockLevel) || 0;
      if (product.unit) existing.units.add(product.unit);
      stockByProduct.set(key, existing);
    });

    const salesByProduct = new Map();
    salesForTrend.forEach(sale => {
      (Array.isArray(sale.items) ? sale.items : []).forEach(item => {
        const name = String(item.productName || item.product?.name || item.name || '').trim();
        const key = name.toLocaleLowerCase();
        const quantity = Number(item.quantity);
        if (!key || !Number.isFinite(quantity) || quantity <= 0) return;
        salesByProduct.set(key, (salesByProduct.get(key) || 0) + quantity);
      });
    });

    return [...salesByProduct.entries()]
      .map(([key, unitsSold]) => {
        const stock = stockByProduct.get(key);
        return stock ? {
          ...stock,
          units: [...stock.units],
          unitsSold,
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [salesForTrend, stockProducts]);

  const maxTopSellerStock = Math.max(...topSellingStock.map(product => product.quantity), 1);

  const isInitialPending = [shopsQuery, dashboardQuery, salesQuery, stockProductsQuery].some(query => query.isPending);
  const showSkeleton = useDelayedLoading(isInitialPending, 200);

  if (isInitialPending) {
    return showSkeleton ? <DashboardSkeleton /> : null;
  }

  return (
    <div className={styles.container}>
      {/* Header with Title and Outlet Filter */}
      <div className={styles.headerRow}>
        <div>
          <h1>Dashboard</h1>
          <p>Real-time analytics, sales volume, and stock status across your retail network</p>
        </div>

        <div className={styles.headerActions}>
          <ExpandingSelect
            value={selectedShopId}
            onChange={setSelectedShopId}
            className={styles.outletSelect}
            ariaLabel="Filter dashboard by outlet"
            startAdornment={<MdStore size={18} className={styles.receiptRef} />}
            options={[
              { value: '', label: 'All Business Outlets' },
              ...shops.map(shop => ({ value: shop.id, label: shop.name }))
            ]}
          />

          <button className={styles.launchPosBtn} onClick={() => navigate('/owner/pos')}>
            <MdPointOfSale size={18} />
            <span>Open POS Counter</span>
          </button>
        </div>
      </div>


      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.revenueSummaryCard}`}>
          <div className={styles.kpiHeading}>
            <div className={styles.cardIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <MdTrendingUp size={24} />
            </div>
            <span className={styles.cardLabel}>Revenue</span>
          </div>
          
          <div className={`${styles.kpiContent} ${styles.revenueContent}`}>
            <div className={styles.revenueToday}>
              <span className={styles.periodTitle}>Today</span>
              <div className={styles.revenueValue}>
                <span>KES</span>
                <strong>{Number(data.todayRevenue || 0).toLocaleString()}</strong>
              </div>
            </div>
            <div className={styles.revenueMonth}>
              <span>This month</span>
              <strong>KES {Number(data.monthRevenue || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.collectionSummaryCard}`}>
          <div className={styles.kpiHeading}>
            <div className={styles.cardIcon} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
              <MdPointOfSale size={24} />
            </div>
            <div className={styles.collectionHeadingText}>
              <span className={styles.cardLabel}>Collections</span>
              <span className={styles.collectionPeriodLabel}>Today</span>
            </div>
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.collectionBreakdown}>
              <span>Cash <strong>KES {Number(data.todayCashCollected || 0).toLocaleString()}</strong></span>
              <span>M-Pesa <strong>KES {Number(data.todayMpesaCollected || 0).toLocaleString()}</strong></span>
              <span>Card <strong>KES {Number(data.todayCardCollected || 0).toLocaleString()}</strong></span>
              {Number(data.todayBankTransferCollected || 0) > 0 && (
                <span>Bank transfer <strong>KES {Number(data.todayBankTransferCollected || 0).toLocaleString()}</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeading}>
            <div className={styles.cardIcon} style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
              <MdCheckCircle size={24} />
            </div>
            <span className={styles.cardLabel}>Profitability</span>
          </div>
          <div className={`${styles.kpiContent} ${styles.profitPeriods}`}>
            <div className={`${styles.metricPeriod} ${styles.profitPeriod}`}>
              <span className={styles.periodTitle}>Today</span>
              <div className={styles.profitMetric}>
                <span className={styles.metricLabel}>Gross profit</span>
                <div className={styles.cardVal}>KES <strong>{Number(data.todayGrossProfit || 0).toLocaleString()}</strong></div>
              </div>
              <div className={styles.profitMetric}>
                <span className={styles.metricLabel}>Net profit</span>
                <div className={styles.cardVal}>KES <strong>{Number(data.todayNetProfit || 0).toLocaleString()}</strong></div>
              </div>
            </div>
            <div className={`${styles.metricPeriod} ${styles.profitPeriod}`}>
              <span className={styles.periodTitle}>This month</span>
              <div className={styles.profitMetric}>
                <span className={styles.metricLabel}>Gross profit</span>
                <div className={styles.cardVal}>KES <strong>{Number(data.monthGrossProfit || 0).toLocaleString()}</strong></div>
              </div>
              <div className={styles.profitMetric}>
                <span className={styles.metricLabel}>Net profit</span>
                <div className={styles.cardVal}>KES <strong>{Number(data.monthNetProfit || 0).toLocaleString()}</strong></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <section className={`${styles.sectionCard} ${styles.salesTrendCard}`} aria-labelledby="sales-trend-title">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="sales-trend-title">Sales trend</h2>
            <span className={styles.sectionSubtitle}>Daily revenue over time</span>
          </div>
          <div className={styles.trendRange} role="group" aria-label="Sales trend period">
            {[7, 30].map(days => (
              <button
                key={days}
                type="button"
                className={salesTrendRange === days ? styles.trendRangeActive : ''}
                aria-pressed={salesTrendRange === days}
                onClick={() => setSalesTrendRange(days)}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
        <div className={styles.salesTrendChart}>
          {salesTrend.maxTotal === 0 ? (
            <div className={styles.trendEmptyState}>No sales recorded in this period.</div>
          ) : (
            <svg
              className={styles.trendSvg}
              viewBox="0 0 700 220"
              role="img"
              aria-label={`Sales revenue for the last ${salesTrendRange} days`}
            >
              <title>Sales revenue for the last {salesTrendRange} days</title>
              {[0, 1, 2, 3].map(step => {
                const y = 174 - step * (146 / 3);
                const amount = salesTrend.chartMax * step / 3;
                return (
                  <g key={step}>
                    <line x1="40" x2="690" y1={y} y2={y} className={styles.trendGridLine} />
                    <text x="34" y={y + 4} textAnchor="end" className={styles.trendAxisLabel}>
                      {amount >= 1000 ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k` : Math.round(amount)}
                    </text>
                  </g>
                );
              })}
              <path d={salesTrend.areaPath} className={styles.trendArea} />
              <polyline points={salesTrend.linePath} className={styles.trendLine} />
              {salesTrend.chartPoints.map(point => (
                <circle key={point.key} cx={point.x} cy={point.y} r="3" className={styles.trendPoint}>
                  <title>{point.date.toLocaleDateString()}: KES {Math.round(point.total).toLocaleString()}</title>
                </circle>
              ))}
              {salesTrend.labels.map(point => (
                <text key={`label-${point.key}`} x={point.x} y="205" textAnchor="middle" className={styles.trendAxisLabel}>
                  {point.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
              ))}
            </svg>
          )}
        </div>
      </section>

      {/* Main Split Section: Recent Transactions + Low Stock Radar */}
      <div className={styles.splitGrid}>
        {/* Recent Transactions Section */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Recent Sales Ledger</h2>
              <span className={styles.sectionSubtitle}>Last transactions logged by counter cashiers</span>
            </div>
            <button className={styles.viewAllBtn} onClick={() => navigate('/sales')}>
              <span>View Full Ledger</span>
              <MdArrowForward size={16} />
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Receipt Ref</th>
                  <th>Outlet</th>
                  <th>Cashier</th>
                  <th>Total</th>
                  <th>Method</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentSales || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyTable}>
                      No sales recorded yet. Ring up a sale in POS to see it live!
                    </td>
                  </tr>
                ) : (
                  data.recentSales.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong className={styles.receiptRef}>
                          #{s.receiptNumber || s.id?.substring(0, 8)}
                        </strong>
                      </td>
                      <td>{s.shopName || 'Main'}</td>
                      <td>{s.cashierName || 'Cashier'}</td>
                      <td>
                        <span className={styles.amountBadge}>KES {Number(s.grandTotal).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`${styles.methodPill} ${styles['method_' + (s.paymentMethod || 'CASH')]}`}>
                          {s.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td className={styles.timeCell}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </td>
                      <td>
                        <button
                          className={styles.viewRowBtn}
                          onClick={() => setViewReceipt(s)}
                          title="View receipt summary"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Stock health</h2>
            </div>
            <button className={styles.viewAllBtn} onClick={() => navigate('/products')}>
              <span>Manage All</span>
              <MdArrowForward size={16} />
            </button>
          </div>

          <div className={styles.stockChart}>
            <div className={styles.stockChartHeading}>
              <h3>Top sellers</h3>
              <span>Current stock</span>
            </div>
            {topSellingStock.length === 0 ? (
              <div className={styles.stockChartEmpty}>No best-selling items to chart yet.</div>
            ) : (
              <div className={styles.stockChartRows}>
                {topSellingStock.map(product => {
                  const stockPercent = Math.min(100, (product.quantity / maxTopSellerStock) * 100);
                  const isLowStock = product.quantity <= product.minStockLevel;
                  const unitLabel = product.units.length === 1 ? product.units[0] : 'units';

                  return (
                    <div className={styles.stockChartRow} key={product.name}>
                      <div className={styles.stockChartMeta}>
                        <span className={styles.stockChartName} title={product.name}>{product.name}</span>
                        <span className={`${styles.stockChartQuantity} ${isLowStock ? styles.stockChartQuantityLow : ''}`}>
                          {product.quantity.toLocaleString()} {unitLabel}
                        </span>
                      </div>
                      <div
                        className={styles.stockChartTrack}
                        role="img"
                        aria-label={`${product.name}: ${product.quantity} ${unitLabel} in stock${isLowStock ? ', below minimum stock level' : ''}`}
                      >
                        <span
                          className={`${styles.stockChartBar} ${isLowStock ? styles.stockChartBarLow : ''}`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.stockAlertsHeading}>
            <h3>Low-stock alerts</h3>
            <span>{data.lowStockCount || 0}</span>
          </div>
          <div className={styles.lowStockList}>
            {(data.lowStockProducts || []).length === 0 ? (
              <div className={styles.healthyStockState}>
                <MdCheckCircle size={36} color="var(--success)" />
                <p>All stock levels are optimal!</p>
                <span>No products are below minimum thresholds.</span>
              </div>
            ) : (
              data.lowStockProducts.map(p => (
                <div key={p.id} className={styles.stockItemCard}>
                  <div className={styles.stockItemMeta}>
                    <div className={styles.stockItemName}>{p.name}</div>
                    <div className={styles.stockItemOutlet}>
                      {p.shop?.name || 'Main Shop'} • Min Alert: {p.min_stock_level} {p.unit}
                    </div>
                  </div>

                  <div className={styles.stockItemRight}>
                    <div className={styles.stockQtyPill}>
                      <strong>{p.quantity}</strong> {p.unit} left
                    </div>
                    <button
                      className={styles.quickRestockBtn}
                      onClick={() => navigate('/products')}
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {viewReceipt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Receipt #{viewReceipt.receiptNumber || viewReceipt.id}</h3>
              <button className={styles.closeBtn} onClick={() => setViewReceipt(null)}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="receipt-printable" style={{ padding: '16px', background: 'var(--receipt-bg)', borderRadius: '8px', border: '1px dashed var(--receipt-border)' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--font-size-3xl-minus)', fontWeight: 800 }}>LEO POS RECEIPT</h4>
                <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-muted)' }}>Outlet: {viewReceipt.shopName || 'Main'}</div>
                <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-muted)' }}>Date: {new Date(viewReceipt.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-strong)', borderBottom: '1px dashed var(--border-strong)', padding: '12px 0', margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>
                  <span>Total Amount:</span>
                  <span>KES {Number(viewReceipt.grandTotal).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-base)', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>Payment Method:</span>
                  <span>{viewReceipt.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-base)', color: 'var(--text-muted)' }}>
                  <span>Processed by:</span>
                  <span>{viewReceipt.cashierName}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Verified Official POS Record
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className={styles.printBtn} onClick={() => window.print()}>
                <MdPrint size={16} /> Print
              </button>
              <button className={styles.closeModalBtn} onClick={() => setViewReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.container} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.visuallyHidden}>Loading dashboard data</span>
      <div className={styles.skeletonHeader}>
        <div>
          <span className={`${styles.skeletonBlock} ${styles.skeletonHeading}`} />
          <span className={`${styles.skeletonBlock} ${styles.skeletonSubtitle}`} />
        </div>
        <span className={`${styles.skeletonBlock} ${styles.skeletonFilter}`} />
      </div>

      <div className={styles.kpiGrid}>
        {[0, 1, 2].map(card => (
          <div className={`${styles.kpiCard} ${styles.skeletonCard}`} key={card}>
            <span className={`${styles.skeletonBlock} ${styles.skeletonLabel}`} />
            <span className={`${styles.skeletonBlock} ${styles.skeletonMetric}`} />
            <span className={`${styles.skeletonBlock} ${styles.skeletonDetail}`} />
          </div>
        ))}
      </div>

      <section className={`${styles.sectionCard} ${styles.skeletonPanel}`}>
        <span className={`${styles.skeletonBlock} ${styles.skeletonSectionTitle}`} />
        <span className={`${styles.skeletonBlock} ${styles.skeletonChart}`} />
      </section>

      <div className={styles.splitGrid}>
        {[0, 1].map(panel => (
          <section className={`${styles.sectionCard} ${styles.skeletonPanel}`} key={panel}>
            <span className={`${styles.skeletonBlock} ${styles.skeletonSectionTitle}`} />
            {[0, 1, 2].map(row => (
              <span className={`${styles.skeletonBlock} ${styles.skeletonRow}`} key={row} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
