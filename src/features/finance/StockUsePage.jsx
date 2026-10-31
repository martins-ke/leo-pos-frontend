import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/api';
import FormWizard from '../../components/forms/FormWizard';
import SimpleFormModal from '../../components/forms/SimpleFormModal';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import styles from './Finance.module.css';

export default function StockUsePage() {
  const { notify, beginSaving } = useFeedback();
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [products, setProducts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [mode, setMode] = useState('withdraw');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', unitCost: '', reason: '', notes: '' });

  useEffect(() => {
    api.get('/shops').then(res => {
      if (res.success && res.body) {
        setShops(res.body);
        if (res.body.length) setShopId(res.body[0].id);
      } else notify({ type: 'error', message: res.message || 'Could not load shops.' });
    }).catch(() => notify({ type: 'error', message: 'Could not load shops.' }));
  }, []);

  const load = useCallback(() => {
    if (!shopId) return;
    Promise.all([
      api.get(`/products?shopId=${encodeURIComponent(shopId)}`),
      api.get(`/inventory/withdrawals?shopId=${encodeURIComponent(shopId)}&page=${page}&size=25`),
      api.get(`/inventory/purchases?shopId=${encodeURIComponent(shopId)}&page=${page}&size=25`)
    ]).then(([productRes, withdrawalRes, purchaseRes]) => {
      if (productRes.success) setProducts(productRes.body || []);
      else {
        setProducts([]);
        notify({ type: 'error', message: productRes.message || 'Could not load products.' });
      }
      if (withdrawalRes.success) setWithdrawals(withdrawalRes.body?.content || []);
      else {
        setWithdrawals([]);
        notify({ type: 'error', message: withdrawalRes.message || 'Could not load stock withdrawals.' });
      }
      if (purchaseRes.success) setPurchases(purchaseRes.body?.content || []);
      else {
        setPurchases([]);
        notify({ type: 'error', message: purchaseRes.message || 'Could not load stock purchases.' });
      }
      setHasNext(withdrawalRes.body?.last === false || purchaseRes.body?.last === false);
    }).catch(() => notify({ type: 'error', message: 'Could not load stock movement history.' }));
  }, [shopId, page]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const saveStatus = beginSaving({
      title: mode === 'withdraw' ? 'Recording stock withdrawal' : 'Recording stock purchase',
    });
    try {
      const quantity = Number(form.quantity);
      const request = { shopId, productId: form.productId, quantity };
      const endpoint = mode === 'withdraw' ? '/inventory/withdrawals' : '/inventory/purchases';
      const body = mode === 'withdraw'
        ? { ...request, reason: form.reason.trim() }
        : { ...request, unitCost: Number(form.unitCost), notes: form.notes.trim() || null, paymentMethod: 'CASH' };
      const res = await api.post(endpoint, body);
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not record stock movement.' });
        return;
      }
      saveStatus.complete({ message: mode === 'withdraw'
        ? `Stock withdrawn. Cost KES ${Number(res.body.totalCost).toLocaleString()} was recorded as personal-use expense.`
        : `Stock purchase of KES ${Number(res.body.totalCost).toLocaleString()} recorded.` });
      setForm(current => ({ ...current, quantity: '', unitCost: '', reason: '', notes: '' }));
      setWizardOpen(false);
      setWizardStep(0);
      load();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while recording stock movement.' });
    } finally {
      setSaving(false);
    }
  };

  const product = products.find(item => item.id === form.productId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>Stock Movements</h1><p>Personal-use stock is expensed at cost; purchases reduce shop cash.</p></div>
        <ExpandingSelect value={shopId} onChange={value => { setShopId(value); setPage(0); }} className={styles.shopSelect}
          ariaLabel="Select shop" options={shops.map(shop => ({ value: shop.id, label: shop.name }))} />
      </header>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2>Recent stock movements</h2>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} disabled={!shopId || !products.length}
              onClick={() => { setMode('withdraw'); setWizardStep(0); setWizardOpen(true); }}>
              Personal use
            </button>
            <button type="button" className={styles.primaryButton} disabled={!shopId || !products.length}
              onClick={() => { setMode('purchase'); setWizardStep(0); setWizardOpen(true); }}>
              Record purchase
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Type</th><th>Product</th><th>Quantity</th><th>Unit cost</th><th>Total cost</th><th>Reason / notes</th><th>Attended by</th><th>Date</th></tr></thead>
            <tbody>
              {[
                ...withdrawals.map(item => ({ ...item, movementType: 'Personal use', note: item.reason })),
                ...purchases.map(item => ({ ...item, movementType: 'Purchase', note: item.notes }))
              ].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).map(item => (
                <tr key={`${item.movementType}-${item.id}`}>
                  <td>{item.movementType}</td><td><strong>{item.product?.name || 'Product'}</strong></td>
                  <td>{item.quantity} {item.product?.unit || ''}</td>
                  <td><span className={styles.moneyValue}>KES {Number(item.unitCost).toLocaleString()}</span></td>
                  <td><span className={styles.moneyValue}>KES {Number(item.totalCost).toLocaleString()}</span></td>
                  <td>{item.note || '—'}</td><td>{item.actorName}</td>
                  <td>{item.occurredAt ? new Date(item.occurredAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {!withdrawals.length && !purchases.length && <tr><td colSpan="8" className={styles.empty}>No stock movements recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} pageSize={25} totalItems={Number.NaN} hasNext={hasNext} onPageChange={setPage} />
      </section>
      <SimpleFormModal
        open={wizardOpen && mode === 'withdraw'}
        title="Personal stock use"
        onClose={() => setWizardOpen(false)}
        onSubmit={submit}
        submitLabel="Confirm withdrawal"
        submitting={saving}
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>Product
            <ExpandingSelect required autoFocus value={form.productId} ariaLabel="Select product"
              options={[
                { value: '', label: 'Select product' },
                ...products.map(item => ({ value: item.id, label: `${item.name} (${item.quantity} ${item.unit})` }))
              ]}
              onChange={productId => {
              const selected = products.find(item => String(item.id) === productId);
              setForm(current => ({ ...current, productId,
                unitCost: selected?.buying_price || selected?.buyingPrice || '' }));
            }} />
          </label>
          <label className={styles.field}>Quantity ({product?.unit || 'unit'})
            <input type="number" min="0.01" step="0.01" required value={form.quantity}
              max={product?.quantity}
              onChange={event => setForm({ ...form, quantity: event.target.value })} />
          </label>
          <label className={styles.field}>Reason
            <input required maxLength="200" value={form.reason}
              onChange={event => setForm({ ...form, reason: event.target.value })} />
          </label>
          {product && <span className={styles.subtle}>
            Available stock: {product.quantity} {product.unit || ''}. No cash is paid out; product cost is recorded as a personal-use expense.
          </span>}
        </div>
      </SimpleFormModal>
      <FormWizard
        open={wizardOpen && mode === 'purchase'}
        title="Record stock purchase"
        steps={['Product', 'Quantity', 'Cost and notes']}
        step={wizardStep}
        onClose={() => { setWizardOpen(false); setWizardStep(0); }}
        onBack={() => setWizardStep(current => current - 1)}
        onNext={() => setWizardStep(current => current + 1)}
        onSubmit={submit}
        submitLabel={mode === 'withdraw' ? 'Confirm withdrawal' : 'Record purchase'}
        submitting={saving}
      >
        {wizardStep === 0 && (
          <label className={styles.field}>Product
            <ExpandingSelect required autoFocus value={form.productId} ariaLabel="Select product"
              options={[
                { value: '', label: 'Select product' },
                ...products.map(item => ({ value: item.id, label: `${item.name} (${item.quantity} ${item.unit})` }))
              ]}
              onChange={productId => {
              const selected = products.find(item => String(item.id) === productId);
              setForm(current => ({ ...current, productId,
                unitCost: selected?.buying_price || selected?.buyingPrice || '' }));
            }} />
          </label>
        )}
        {wizardStep === 1 && (
          <label className={styles.field}>Quantity ({product?.unit || 'unit'})
            <input type="number" min="0.01" step="0.01" required autoFocus value={form.quantity}
              onChange={event => setForm({ ...form, quantity: event.target.value })} />
          </label>
        )}
        {wizardStep === 2 && (
          <div className={styles.formGrid}>
            <label className={styles.field}>Actual unit purchase cost (KES)
              <input type="number" min="0.01" step="0.01" required autoFocus value={form.unitCost}
                onChange={event => setForm({ ...form, unitCost: event.target.value })} />
            </label>
            <label className={styles.field}>Purchase notes (optional)
              <input maxLength="300" value={form.notes}
                onChange={event => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>
        )}
      </FormWizard>
    </div>
  );
}
