import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/api';
import FormWizard from '../../components/forms/FormWizard';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import styles from './Finance.module.css';

export default function DebtsPage() {
  const { notify, beginSaving } = useFeedback();
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerPage, setCustomerPage] = useState(0);
  const [customersHaveNext, setCustomersHaveNext] = useState(false);
  const [debts, setDebts] = useState([]);
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [payments, setPayments] = useState({});
  const [form, setForm] = useState({ customerId: '', amount: '', dueDate: '', description: '' });

  useEffect(() => {
    api.get('/shops').then(res => {
      if (res.success && res.body) {
        setShops(res.body);
        if (res.body.length) setShopId(res.body[0].id);
      } else notify({ type: 'error', message: res.message || 'Could not load shops.' });
    }).catch(() => notify({ type: 'error', message: 'Could not load shops.' }));
  }, []);

  useEffect(() => {
    let active = true;
    if (!shopId) {
      setCustomers([]);
      setCustomersHaveNext(false);
      setCustomersLoading(false);
      return () => { active = false; };
    }

    setCustomersLoading(true);
    api.get(`/customers?shopId=${encodeURIComponent(shopId)}&page=${customerPage}&size=100`)
      .then(res => {
        if (!active) return;
        if (!res.success) {
          setCustomers([]);
          setCustomersHaveNext(false);
          notify({ type: 'error', message: res.message || 'Could not load eligible customers.' });
          return;
        }
        const eligible = (res.body?.content || []).filter(customer => customer.creditEligible);
        setCustomers(eligible);
        setCustomersHaveNext(res.body?.last === false);
        setForm(current => eligible.some(customer => customer.id === current.customerId)
          ? current
          : { ...current, customerId: eligible[0]?.id || '' });
      })
      .catch(() => {
        if (!active) return;
        setCustomers([]);
        setCustomersHaveNext(false);
        notify({ type: 'error', message: 'Could not load eligible customers.' });
      })
      .finally(() => {
        if (active) setCustomersLoading(false);
      });

    return () => { active = false; };
  }, [customerPage, shopId]);

  const loadDebts = useCallback((requestedStatus = status, requestedPage = page) => {
    if (!shopId) return;
    api.get(`/debts?shopId=${encodeURIComponent(shopId)}&status=${requestedStatus}&page=${requestedPage}&size=50`)
      .then(res => {
        if (res.success && res.body) {
          setDebts(res.body.content || []);
          setHasNext(Boolean(res.body.last === false));
        } else {
          setDebts([]);
          setHasNext(false);
          notify({ type: 'error', message: res.message || 'Could not load debts.' });
        }
      })
      .catch(() => notify({ type: 'error', message: 'Could not load debts.' }));
  }, [page, shopId, status]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const createDebt = async (event) => {
    event.preventDefault();
    if (!shopId || !form.customerId) {
      notify({ type: 'error', message: 'Select a credit-approved customer before recording a debt.' });
      return;
    }
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      notify({ type: 'error', message: 'Enter a valid positive debt amount.' });
      return;
    }
    const saveStatus = beginSaving({ title: 'Recording customer debt' });
    try {
      const res = await api.post('/debts', {
        shopId,
        customerId: form.customerId,
        amount: Number(form.amount),
        dueDate: form.dueDate || null,
        description: form.description.trim() || null
      });
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not record debt.' });
        return;
      }
      setForm(current => ({ ...current, amount: '', dueDate: '', description: '' }));
      setWizardOpen(false);
      setWizardStep(0);
      setStatus('OPEN');
      setPage(0);
      saveStatus.complete({ message: 'Debt recorded independently from sales.' });
      if (status === 'OPEN' && page === 0) loadDebts('OPEN', 0);
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while recording the debt.' });
    }
  };

  const goToCustomerPage = (nextPage) => {
    setCustomers([]);
    setForm(current => ({ ...current, customerId: '' }));
    setCustomerPage(nextPage);
  };

  const recordPayment = async (debt) => {
    const amount = Number(paymentAmounts[debt.id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify({ type: 'error', message: 'Enter a positive repayment amount.' });
      return;
    }
    const saveStatus = beginSaving({ title: 'Recording debt repayment' });
    try {
      const res = await api.post(`/debts/${debt.id}/payments`, { amount, paymentMethod: 'CASH' });
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not record repayment.' });
        return;
      }
      setPaymentAmounts(current => ({ ...current, [debt.id]: '' }));
      saveStatus.complete({ message: 'Payment recorded with the staff member and timestamp.' });
      loadDebts();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while recording repayment.' });
    }
  };

  const showPayments = async (debtId) => {
    try {
      const res = await api.get(`/debts/${debtId}/payments`);
      if (res.success) {
        setPayments(current => ({ ...current, [debtId]: res.body || [] }));
      } else notify({ type: 'error', message: res.message || 'Could not load payment history.' });
    } catch {
      notify({ type: 'error', message: 'Could not connect to the server while loading payment history.' });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>Customer Debts</h1><p>Manage manually recorded debts and balances linked to POS sales.</p></div>
        <ExpandingSelect value={shopId} onChange={value => {
          setShopId(value);
          setPage(0);
          setCustomerPage(0);
          setCustomers([]);
          setForm(current => ({ ...current, customerId: '' }));
        }}
          className={styles.shopSelect} ariaLabel="Select shop"
          options={shops.map(shop => ({ value: shop.id, label: shop.name }))} />
      </header>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2>Debt ledger</h2>
          <div className={styles.actions}>
            <ExpandingSelect
              value={status}
              onChange={value => { setStatus(value); setPage(0); }}
              className={styles.debtStatusSelect}
              ariaLabel="Filter debts by status"
              options={[
                { value: 'OPEN', label: 'Outstanding' },
                { value: 'SETTLED', label: 'Recently settled' },
                { value: 'ALL', label: 'All retained' }
              ]}
            />
            <button type="button" className={styles.primaryButton} disabled={!shopId || customersLoading}
              onClick={() => { setWizardStep(0); setWizardOpen(true); }}>
              {customersLoading ? 'Loading customers...' : 'Record debt'}
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Customer</th><th>Recorded</th><th>Due</th><th>Debt Amount</th><th>Outstanding</th><th>Recorded by</th><th>Repayment</th><th>Action</th></tr></thead>
            <tbody>
              {debts.map(debt => (
                <tr key={debt.id}>
                  <td><strong>{debt.customerName}</strong><div className={styles.subtle}>{debt.description || ''}</div></td>
                  <td>{debt.createdAt ? new Date(debt.createdAt).toLocaleDateString() : '—'}</td>
                  <td>{debt.dueDate || '—'}</td>
                  <td><span className={styles.moneyValue}>KES {Number(debt.principal).toLocaleString()}</span></td>
                  <td><span className={styles.moneyValue}>KES {Number(debt.outstandingBalance).toLocaleString()}</span></td>
                  <td>{debt.createdByName}</td>
                  <td>{debt.status === 'OPEN' ? <input aria-label={`Repayment amount for ${debt.customerName}`}
                    type="number" min="0.01" max={debt.outstandingBalance} step="0.01"
                    value={paymentAmounts[debt.id] || ''}
                    onChange={event => setPaymentAmounts(current => ({ ...current, [debt.id]: event.target.value }))} /> : 'Settled'}</td>
                  <td><div className={styles.actions}>
                    {debt.status === 'OPEN' && <button className={styles.smallButton} onClick={() => recordPayment(debt)}>Receive</button>}
                    <button className={styles.smallButton} onClick={() => showPayments(debt.id)}>Payment history</button>
                  </div></td>
                </tr>
              ))}
              {!debts.length && <tr><td colSpan="8" className={styles.empty}>No debts for this view.</td></tr>}
            </tbody>
          </table>
        </div>
        {Object.entries(payments).map(([debtId, entries]) => (
          <div className={styles.panel} key={debtId}>
            <strong>Repayments</strong>
            {entries.map(entry => <span className={styles.subtle} key={entry.id}>
              <span className={styles.moneyValue}>KES {Number(entry.amount).toLocaleString()}</span> · {entry.receivedByName} · {entry.receivedAt ? new Date(entry.receivedAt).toLocaleString() : ''}
            </span>)}
          </div>
        ))}
        <PaginationControls page={page} pageSize={50} totalItems={Number.NaN} hasNext={hasNext} onPageChange={setPage} />
      </section>
      <FormWizard
        open={wizardOpen}
        title="Record a customer debt"
        steps={['Customer', 'Debt details']}
        step={wizardStep}
        onClose={() => { setWizardOpen(false); setWizardStep(0); }}
        onBack={() => setWizardStep(current => current - 1)}
        onNext={() => setWizardStep(current => current + 1)}
        onSubmit={createDebt}
        submitLabel="Save debt"
      >
        {wizardStep === 0 ? (
          <div className={styles.customerPicker}>
            <label className={styles.field}>Credit-approved customer
              <ExpandingSelect
                value={form.customerId}
                onChange={customerId => setForm(current => ({ ...current, customerId }))}
                className={styles.debtCustomerSelect}
                ariaLabel="Credit-approved customer"
                required
                autoFocus
                options={[
                  { value: '', label: 'Select customer' },
                  ...customers.map(customer => ({ value: customer.id, label: customer.name }))
                ]}
              />
            </label>
            {!customersLoading && !customers.length && !customersHaveNext && (
              <p className={styles.selectHint}>No credit-approved customers found. Approve credit for a customer on the Customers page first.</p>
            )}
            {!customersLoading && !customers.length && customersHaveNext && (
              <p className={styles.selectHint}>No approved customers on this page. Continue to the next page to check.</p>
            )}
            <PaginationControls
              page={customerPage}
              pageSize={100}
              totalItems={Number.NaN}
              hasNext={customersHaveNext}
              onPageChange={goToCustomerPage}
            />
          </div>
        ) : (
          <div className={styles.formGrid}>
            <label className={styles.field}>Amount (KES)
              <input type="number" min="0.01" step="0.01" required autoFocus value={form.amount}
                onChange={event => setForm({ ...form, amount: event.target.value })} />
            </label>
            <label className={styles.field}>Due date (optional)
              <input type="date" value={form.dueDate}
                onChange={event => setForm({ ...form, dueDate: event.target.value })} />
            </label>
            <label className={styles.field}>Description (optional)
              <input maxLength="300" value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })} />
            </label>
          </div>
        )}
      </FormWizard>
    </div>
  );
}
