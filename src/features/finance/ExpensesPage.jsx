import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/api';
import FormWizard from '../../components/forms/FormWizard';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import styles from './Finance.module.css';

const today = new Date().toISOString().slice(0, 10);

export default function ExpensesPage() {
  const { notify, beginSaving } = useFeedback();
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [form, setForm] = useState({
    category: '', amount: '', expenseDate: today, payee: '', paymentMethod: 'CASH', notes: ''
  });

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
      api.get(`/expenses?shopId=${encodeURIComponent(shopId)}&page=${page}&size=50`),
      api.get(`/expenses/categories?shopId=${encodeURIComponent(shopId)}`)
    ]).then(([expenseRes, categoryRes]) => {
      if (expenseRes.success && expenseRes.body) {
        setExpenses(expenseRes.body.content || []);
        setHasNext(expenseRes.body.last === false);
      } else {
        setExpenses([]);
        setHasNext(false);
        notify({ type: 'error', message: expenseRes.message || 'Could not load expenses.' });
      }
      if (categoryRes.success) setCategories(categoryRes.body || []);
      else notify({ type: 'error', message: categoryRes.message || 'Could not load expense categories.' });
    }).catch(() => notify({ type: 'error', message: 'Could not load expenses.' }));
  }, [page, shopId]);

  useEffect(() => { load(); }, [load]);

  const createExpense = async (event) => {
    event.preventDefault();
    const saveStatus = beginSaving({ title: 'Recording expense' });
    try {
      const res = await api.post('/expenses', { ...form, shopId, amount: Number(form.amount) });
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not record expense.' });
        return;
      }
      saveStatus.complete({
        message: `Expense recorded${res.body?.paidByName ? ` by ${res.body.paidByName}` : ''}.`,
      });
      setForm(current => ({ ...current, category: '', amount: '', payee: '', notes: '' }));
      setWizardOpen(false);
      setWizardStep(0);
      load();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while recording the expense.' });
    }
  };

  const createCategory = async () => {
    const name = window.prompt('New expense category name');
    if (!name?.trim() || !shopId) return;
    const saveStatus = beginSaving({ title: 'Adding expense category' });
    try {
      const res = await api.post('/expenses/categories', { shopId, name: name.trim() });
      if (res.success) {
        setCategories(current => [...current.filter(category => category.name !== res.body.name), res.body]);
        setForm(current => ({ ...current, category: res.body.name }));
        saveStatus.complete({ message: 'Expense category added.' });
      } else saveStatus.fail({ message: res.message || 'Could not save category.' });
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while adding the category.' });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>Operating Expenses</h1><p>Expenses reduce operating profit and the shop account balance.</p></div>
        <ExpandingSelect value={shopId} onChange={value => { setShopId(value); setPage(0); }}
          className={styles.shopSelect} ariaLabel="Select shop"
          options={shops.map(shop => ({ value: shop.id, label: shop.name }))} />
      </header>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2>Expense history</h2>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={createCategory} disabled={!shopId}>
              Add category
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => {
              setWizardStep(0);
              setWizardOpen(true);
            }} disabled={!shopId}>
              Record expense
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Paid to</th><th>Method</th><th>Recorded by</th><th>Notes</th></tr></thead>
            <tbody>
              {expenses.map(expense => <tr key={expense.id}>
                <td>{expense.expenseDate}</td><td><strong>{expense.category}</strong></td>
                <td><span className={styles.moneyValue}>KES {Number(expense.amount).toLocaleString()}</span></td><td>{expense.payee || '—'}</td>
                <td>{expense.paymentMethod || '—'}</td><td>{expense.paidByName}</td><td>{expense.notes || '—'}</td>
              </tr>)}
              {!expenses.length && <tr><td colSpan="7" className={styles.empty}>No expenses recorded.</td></tr>}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} pageSize={50} totalItems={Number.NaN} hasNext={hasNext} onPageChange={setPage} />
      </section>
      <FormWizard
        open={wizardOpen}
        title="Record operating expense"
        steps={['Expense', 'Payment', 'Details']}
        step={wizardStep}
        onClose={() => { setWizardOpen(false); setWizardStep(0); }}
        onBack={() => setWizardStep(current => current - 1)}
        onNext={() => setWizardStep(current => current + 1)}
        onSubmit={createExpense}
        submitLabel="Save expense"
      >
        {wizardStep === 0 && (
          <div className={styles.formGrid}>
            <label className={styles.field}>Category
              <input list="expense-categories" required maxLength="80" autoFocus value={form.category}
                onChange={event => setForm({ ...form, category: event.target.value })} />
              <datalist id="expense-categories">
                {categories.map(category => <option key={category.id} value={category.name} />)}
              </datalist>
            </label>
            <label className={styles.field}>Amount (KES)
              <input type="number" min="0.01" step="0.01" required value={form.amount}
                onChange={event => setForm({ ...form, amount: event.target.value })} />
            </label>
          </div>
        )}
        {wizardStep === 1 && (
          <div className={styles.formGrid}>
            <label className={styles.field}>Date paid
              <input type="date" required max={today} value={form.expenseDate}
                onChange={event => setForm({ ...form, expenseDate: event.target.value })} />
            </label>
            <label className={styles.field}>Payment method
              <ExpandingSelect
                value={form.paymentMethod}
                onChange={paymentMethod => setForm(current => ({ ...current, paymentMethod }))}
                ariaLabel="Expense payment method"
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'MPESA', label: 'M-Pesa' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'BANK_TRANSFER', label: 'Bank transfer' }
                ]}
              />
            </label>
          </div>
        )}
        {wizardStep === 2 && (
          <div className={styles.formGrid}>
            <label className={styles.field}>Paid to (optional)
              <input maxLength="120" value={form.payee}
                onChange={event => setForm({ ...form, payee: event.target.value })} />
            </label>
            <label className={styles.field}>Notes (optional)
              <input maxLength="500" value={form.notes}
                onChange={event => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>
        )}
      </FormWizard>
    </div>
  );
}
