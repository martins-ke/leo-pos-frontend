import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/api';
import SimpleFormModal from '../../components/forms/SimpleFormModal';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useAuth } from '../../context/useAuth';
import { useFeedback } from '../../context/useFeedback';
import styles from './Finance.module.css';

export default function CustomersPage() {
  const { notify, beginSaving, confirm } = useFeedback();
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/shops').then(res => {
      if (res.success && res.body) {
        setShops(res.body);
        if (res.body.length) setShopId(res.body[0].id);
      } else notify({ type: 'error', message: res.message || 'Could not load shops.' });
    }).catch(() => notify({ type: 'error', message: 'Could not load shops.' }));
  }, []);

  const loadCustomers = useCallback(() => {
    if (!shopId) return;
    api.get(`/customers?shopId=${encodeURIComponent(shopId)}&page=${page}&size=50`)
      .then(res => {
        if (res.success && res.body) {
          setCustomers(res.body.content || []);
          setHasNext(Boolean(res.body.last === false));
        } else {
          setCustomers([]);
          setHasNext(false);
          notify({ type: 'error', message: res.message || 'Could not load customers.' });
        }
      })
      .catch(() => notify({ type: 'error', message: 'Could not load customers.' }));
  }, [page, shopId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const createCustomer = async (event) => {
    event.preventDefault();
    setSaving(true);
    const saveStatus = beginSaving({ title: 'Creating customer' });
    try {
      const res = await api.post('/customers', { ...form, shopId });
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not create customer.' });
        return;
      }
      setForm({ name: '', phone: '', email: '' });
      setFormOpen(false);
      setPage(0);
      loadCustomers();
      saveStatus.complete({
        message: 'Customer saved. Credit eligibility is off until the owner approves it.',
      });
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while creating the customer.' });
    } finally {
      setSaving(false);
    }
  };

  const setEligibility = async (customer) => {
    const saveStatus = beginSaving({ title: 'Updating credit eligibility' });
    try {
      const res = await api.patch(`/customers/${customer.id}/eligibility`, {
        creditEligible: !customer.creditEligible
      });
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not update eligibility.' });
        return;
      }
      saveStatus.complete({ message: 'Customer credit eligibility updated.' });
      loadCustomers();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while updating eligibility.' });
    }
  };

  const deleteCustomer = async (customer) => {
    const confirmed = await confirm({
      title: `Delete ${customer.name}?`,
      message: 'Historical sales will be anonymized.',
      confirmLabel: 'Delete customer',
      variant: 'danger',
    });
    if (!confirmed) return;
    const saveStatus = beginSaving({ title: 'Deleting customer' });
    try {
      const res = await api.delete(`/customers/${customer.id}`);
      if (!res.success) {
        saveStatus.fail({ message: res.message || 'Could not delete customer.' });
        return;
      }
      saveStatus.complete({ message: 'Customer deleted.' });
      loadCustomers();
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while deleting the customer.' });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Customers</h1>
          <p>Customer purchase history is separate from customer debts.</p>
        </div>
        <ExpandingSelect
          value={shopId}
          onChange={(value) => { setShopId(value); setPage(0); }}
          className={styles.shopSelect}
          ariaLabel="Select shop"
          options={shops.map(shop => ({ value: shop.id, label: shop.name }))}
        />
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2>Customer records</h2>
          <button className={styles.primaryButton} type="button" disabled={!shopId}
            onClick={() => setFormOpen(true)}>
            Add customer
          </button>
        </div>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.customerTable}`}>
            <thead><tr><th>Name</th><th>Contact</th><th>Past sales</th><th>Credit</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.phone || customer.email || '—'}</td>
                  <td>{customer.previousSalesCount} sale(s) · <span className={styles.moneyValue}>KES {Number(customer.previousSalesTotal).toLocaleString()}</span></td>
                  <td><span className={`${styles.badge} ${customer.creditEligible ? '' : styles.badgeWarning}`}>
                    {customer.creditEligible ? 'Eligible' : 'Not eligible'}
                  </span></td>
                  <td><div className={`${styles.actions} ${styles.customerActions}`}>
                    {user?.role === 'OWNER' && <>
                      <button type="button" className={styles.smallButton} onClick={() => setEligibility(customer)}>
                        {customer.creditEligible ? 'Disable credit' : 'Approve credit'}
                      </button>
                      <button type="button" className={styles.dangerButton} onClick={() => deleteCustomer(customer)}>Delete</button>
                    </>}
                  </div></td>
                </tr>
              ))}
              {!customers.length && <tr><td colSpan="5" className={styles.empty}>No customers recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} pageSize={50} totalItems={Number.NaN} hasNext={hasNext} onPageChange={setPage} />
      </section>

      <SimpleFormModal
        open={formOpen}
        title="Add customer"
        onClose={() => setFormOpen(false)}
        onSubmit={createCustomer}
        submitLabel="Save customer"
        submitting={saving}
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>Customer name
            <input required maxLength="120" autoFocus value={form.name}
              onChange={event => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className={styles.field}>Phone (optional)
            <input maxLength="40" value={form.phone}
              onChange={event => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label className={styles.field}>Email (optional)
            <input type="email" maxLength="160" value={form.email}
              onChange={event => setForm({ ...form, email: event.target.value })} />
          </label>
        </div>
      </SimpleFormModal>
    </div>
  );
}
