import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/api';
import SimpleFormModal from '../../components/forms/SimpleFormModal';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import styles from './Finance.module.css';

const formatMoney = value => `KES ${Number(value || 0).toLocaleString()}`;

export default function AccountsPage() {
  const { notify, beginSaving, confirm } = useFeedback();
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [capital, setCapital] = useState({ amount: '', description: '' });
  const [drawing, setDrawing] = useState({ amount: '', description: '', paymentMethod: 'CASH' });
  const [wizardKind, setWizardKind] = useState(null);
  const [saving, setSaving] = useState(false);

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
      api.get(`/accounts/${encodeURIComponent(shopId)}/summary`),
      api.get(`/accounts/${encodeURIComponent(shopId)}/transactions?page=${page}&size=50`)
    ]).then(([summaryRes, transactionRes]) => {
      if (summaryRes.success && summaryRes.body) setSummary(summaryRes.body);
      else notify({ type: 'error', message: summaryRes.message || 'Could not load account summary.' });
      if (transactionRes.success && transactionRes.body) {
        setTransactions(transactionRes.body.content || []);
        setHasNext(transactionRes.body.last === false);
      } else {
        setTransactions([]);
        setHasNext(false);
        notify({ type: 'error', message: transactionRes.message || 'Could not load account transactions.' });
      }
    }).catch(() => notify({ type: 'error', message: 'Could not load shop account.' }));
  }, [shopId, page]);

  useEffect(() => { load(); }, [load]);

  const addCapital = async (event) => {
    event.preventDefault();
    setSaving(true);
    const saveStatus = beginSaving({ title: 'Adding shop capital' });
    try {
      const res = await api.post(`/accounts/${encodeURIComponent(shopId)}/capital`, {
        amount: Number(capital.amount), description: capital.description.trim() || null, paymentMethod: 'CASH'
      });
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not add capital.' });
        return;
      }
      setCapital({ amount: '', description: '' });
      setWizardKind(null);
      saveStatus.complete({ message: 'Capital added to the shop account.' });
      load();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while adding capital.' });
    } finally {
      setSaving(false);
    }
  };

  const submitDrawing = async (confirmOverProfit) => api.post(
    `/accounts/${encodeURIComponent(shopId)}/drawings`,
    { ...drawing, amount: Number(drawing.amount), confirmOverProfit }
  );

  const makeDrawing = async (event) => {
    event.preventDefault();
    setSaving(true);
    let saveStatus = beginSaving({ title: 'Recording owner drawing' });
    try {
      let res = await submitDrawing(false);
      if (!res.success && res.message?.includes('exceeds remaining profit')) {
        saveStatus.dismiss();
        const confirmed = await confirm({
          title: 'Drawing exceeds remaining profit',
          message: `${res.message} Continue using working capital?`,
          confirmLabel: 'Continue',
        });
        if (!confirmed) return;
        saveStatus = beginSaving({ title: 'Recording owner drawing' });
        res = await submitDrawing(true);
      }
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not record owner drawing.' });
        return;
      }
      setDrawing({ amount: '', description: '', paymentMethod: 'CASH' });
      setWizardKind(null);
      saveStatus.complete({
        message: 'Owner drawing recorded. It reduces cash and remaining profit after drawings, not operating net profit.',
      });
      load();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while recording the owner drawing.' });
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    ['Shop account cash', summary?.accountBalance],
    ['Gross profit', summary?.grossProfit],
    ['Operating expenses', summary?.operatingExpenses],
    ['Operating net profit', summary?.netProfit],
    ['Owner drawings', summary?.ownerDrawings],
    ['Profit after drawings', summary?.remainingProfitAfterDrawings]
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>Shop Account & Profit</h1><p>Profit uses retained sales and expense history; cash is tracked from the opening balance onward.</p></div>
        <ExpandingSelect value={shopId} onChange={value => { setShopId(value); setPage(0); }}
          className={styles.shopSelect} ariaLabel="Select shop"
          options={shops.map(shop => ({ value: shop.id, label: shop.name }))} />
      </header>
      <section className={styles.summaryGrid}>
        {cards.map(([label, value]) => <div className={styles.summaryCard} key={label}>
          <span className={styles.summaryLabel}>{label}</span>
          <strong className={styles.summaryValue}>{formatMoney(value)}</strong>
        </div>)}
      </section>
      <div className={styles.alert}>
        Profit after drawings is an accounting figure, not cash. Drawings above remaining profit may use working capital, but cannot exceed the shop-account cash balance.
      </div>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2>Record account activity</h2>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} disabled={!shopId}
              onClick={() => setWizardKind('capital')}>
              Add capital
            </button>
            <button type="button" className={styles.primaryButton} disabled={!shopId}
              onClick={() => setWizardKind('drawing')}>
              Record drawing
            </button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Shop account transactions</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Date</th><th>Type</th><th>Direction</th><th>Amount</th><th>Method</th><th>Notes</th><th>Recorded by</th></tr></thead>
            <tbody>
              {transactions.map(item => <tr key={item.id}>
                <td>{item.occurredAt ? new Date(item.occurredAt).toLocaleString() : '—'}</td>
                <td><strong>{item.type.replaceAll('_', ' ')}</strong></td>
                <td><span className={`${styles.badge} ${item.direction === 'OUT' ? styles.badgeWarning : ''}`}>{item.direction}</span></td>
                <td><span className={styles.moneyValue}>{formatMoney(item.amount)}</span></td><td>{item.paymentMethod || '—'}</td>
                <td>{item.description || '—'}</td><td>{item.actorName}</td>
              </tr>)}
              {!transactions.length && <tr><td colSpan="7" className={styles.empty}>No account transactions yet. Record starting capital to begin tracking cash.</td></tr>}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} pageSize={50} totalItems={Number.NaN} hasNext={hasNext} onPageChange={setPage} />
      </section>
      <SimpleFormModal
        open={wizardKind === 'capital'}
        title="Add capital"
        onClose={() => setWizardKind(null)}
        onSubmit={addCapital}
        submitLabel="Add capital"
        submitting={saving}
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>Amount (KES)
            <input type="number" min="0.01" step="0.01" required autoFocus value={capital.amount}
              onChange={event => setCapital({ ...capital, amount: event.target.value })} />
          </label>
          <label className={styles.field}>Description (optional)
            <input maxLength="300" value={capital.description}
              onChange={event => setCapital({ ...capital, description: event.target.value })} />
          </label>
        </div>
      </SimpleFormModal>
      <SimpleFormModal
        open={wizardKind === 'drawing'}
        title="Record owner drawing"
        onClose={() => setWizardKind(null)}
        onSubmit={makeDrawing}
        submitLabel="Record drawing"
        submitting={saving}
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>Amount (KES)
            <input type="number" min="0.01" step="0.01" required autoFocus value={drawing.amount}
              onChange={event => setDrawing({ ...drawing, amount: event.target.value })} />
          </label>
          <label className={styles.field}>Payment method
            <ExpandingSelect
              value={drawing.paymentMethod}
              onChange={paymentMethod => setDrawing(current => ({ ...current, paymentMethod }))}
              ariaLabel="Drawing payment method"
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'MPESA', label: 'M-Pesa' },
                { value: 'CARD', label: 'Card' },
                { value: 'BANK_TRANSFER', label: 'Bank transfer' }
              ]}
            />
          </label>
          <label className={styles.field}>Notes (optional)
            <input maxLength="300" value={drawing.description}
              onChange={event => setDrawing({ ...drawing, description: event.target.value })} />
          </label>
        </div>
      </SimpleFormModal>
    </div>
  );
}
