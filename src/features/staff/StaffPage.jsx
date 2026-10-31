import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import {
  MdCheck, MdPersonAdd, MdDelete,
  MdClose, MdSearch, MdPeople, MdShield, MdHowToReg, MdStorefront
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import FormWizard from '../../components/forms/FormWizard';
import { useFeedback } from '../../context/useFeedback';
import styles from '../dashboard/Dashboard.module.css';

const PAGE_SIZE = 20;

// ─── Shop Assignment Modal ──────────────────────────────────────────────────
function ShopAssignModal({ staff, onClose, onUpdated }) {
  const { notify, beginSaving } = useFeedback();
  const [allShops, setAllShops] = useState([]);
  const [assigned, setAssigned] = useState(new Set());
  const [original, setOriginal] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/shops')
      .then(res => {
        if (res.success && res.body) {
          setAllShops(res.body);
        } else {
          notify({ type: 'error', message: 'Could not load shops.' });
        }
        // Build set of already-assigned shop IDs from staff object
        const assignedIds = new Set((staff.shops || []).map(s => s.id));
        setAssigned(new Set(assignedIds));
        setOriginal(new Set(assignedIds));
      })
      .catch(() => notify({ type: 'error', message: 'Network error loading shops.' }))
      .finally(() => setLoading(false));
  }, [staff.id]);

  const toggle = (shopId) => {
    setAssigned(prev => {
      const next = new Set(prev);
      if (next.has(shopId)) next.delete(shopId);
      else next.add(shopId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const saveStatus = beginSaving({ title: 'Updating shop assignments' });
    try {
      const toAdd = [...assigned].filter(id => !original.has(id));
      const toRemove = [...original].filter(id => !assigned.has(id));

      await Promise.all([
        ...toAdd.map(shopId => api.patch(`/staff/${staff.id}/shops/${shopId}`, {})),
        ...toRemove.map(shopId => api.delete(`/staff/${staff.id}/shops/${shopId}`)),
      ]);

      saveStatus.complete({ message: `Shop assignments updated for ${staff.username}` });
      onUpdated();
    } catch {
      saveStatus.fail({ message: 'Failed to update shop assignments.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: '12px', padding: '28px',
          minWidth: '340px', maxWidth: '460px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Assign Shops — {staff.username}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <MdClose size={20} />
          </button>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading shops...</p>
        ) : allShops.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No shops found. Create a shop first.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
            {allShops.map(shop => (
              <li key={shop.id}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: assigned.has(shop.id) ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  border: `1.5px solid ${assigned.has(shop.id) ? 'var(--primary)' : 'var(--border)'}`,
                  transition: 'all 0.15s'
                }}>
                  <input
                    type="checkbox"
                    checked={assigned.has(shop.id)}
                    onChange={() => toggle(shop.id)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <MdStorefront size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{shop.name}</span>
                  {shop.location && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {shop.location}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'var(--bg-subtle)', cursor: 'pointer', color: 'var(--text-main)'
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none',
              background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 600
            }}
          >
            {saving ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main StaffPage ─────────────────────────────────────────────────────────
export default function StaffPage() {
  const { notify, beginSaving, confirm } = useFeedback();
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'STAFF', status: 'ACTIVE' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [shopModalStaff, setShopModalStaff] = useState(null); // staff member whose shops we're managing

  const showAlert = (type, text) => notify({ type, message: text });

  const loadStaff = () => {
    setLoading(true);
    api.get('/staff')
      .then(res => {
        if (res.success && res.body) setStaff(res.body);
        else showAlert('error', res.message || 'Could not load staff list');
      })
      .catch(() => showAlert('error', 'Could not load staff list'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStaff(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const saveStatus = beginSaving({ title: 'Creating staff account' });
    try {
      const res = await api.post('/staff', form);
      if (res.success) {
        saveStatus.complete({ message: `Staff account "${form.username}" was created.` });
        setShowModal(false);
        setForm({ username: '', email: '', password: '', role: 'STAFF', status: 'ACTIVE' });
        loadStaff();
      } else {
        saveStatus.fail({ message: res.message || 'Could not create staff account.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server.' });
    }
  };

  const handleApprove = async (id, name) => {
    const saveStatus = beginSaving({ title: 'Approving staff account' });
    try {
      const res = await api.patch(`/staff/${id}/approve`, {});
      if (res.success) {
        saveStatus.complete({ message: `Cashier "${name}" was approved.` });
        loadStaff();
      } else {
        saveStatus.fail({ message: res.message || 'Could not approve this account.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server.' });
    }
  };

  const handleToggleStatus = async (id, name) => {
    const saveStatus = beginSaving({ title: 'Updating staff account' });
    try {
      const res = await api.patch(`/staff/${id}/deactivate`, {});
      if (res.success) {
        saveStatus.complete({ message: `Account status for "${name}" was updated.` });
        loadStaff();
      } else {
        saveStatus.fail({ message: res.message || 'Could not update the account status.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server.' });
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: `Delete staff account "${name}"?`,
      message: 'The staff account will be permanently removed.',
      confirmLabel: 'Delete account',
      variant: 'danger',
    });
    if (!confirmed) return;
    const saveStatus = beginSaving({ title: 'Deleting staff account' });
    try {
      const res = await api.delete(`/staff/${id}`);
      if (res.success) {
        saveStatus.complete({ message: `Staff account "${name}" was deleted.` });
        loadStaff();
      } else {
        saveStatus.fail({ message: res.message || 'Could not delete the staff account.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server.' });
    }
  };

  const filteredStaff = staff.filter(s =>
    (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filteredStaff.length / PAGE_SIZE);
  const visibleStaff = filteredStaff.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(current => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const activeCount = staff.filter(s => s.status === 'ACTIVE').length;
  const pendingCount = staff.filter(s => s.status === 'PENDING').length;

  return (
    <div className={`${styles.container} ${styles.mobilePage}`}>
      {/* Shop assignment modal */}
      {shopModalStaff && (
        <ShopAssignModal
          staff={shopModalStaff}
          onClose={() => setShopModalStaff(null)}
          onUpdated={() => { setShopModalStaff(null); loadStaff(); }}
        />
      )}

      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.h1}>Staff &amp; Counter Cashiers</h1>
          <p>Authorize cashier counter access, assign role privileges, and review team permissions</p>
        </div>
        <button
          className={styles.launchPosBtn}
          onClick={() => { setFormStep(0); setShowModal(true); }}
        >
          <MdPersonAdd size={20} />
          <span>New Cashier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MdPeople size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Total Accounts</span>
            <div className={styles.cardVal}>{staff.length} Users</div>
            <span className={styles.kpiSub}>Registered in system</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <MdHowToReg size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Active Counters</span>
            <div className={styles.cardVal}>{activeCount} Authorized</div>
            <span className={styles.kpiSub}>Can log in to POS register</span>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className={`${styles.kpiCard} ${styles.kpiCardWarning}`}>
            <div className={styles.cardIcon} style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
              <MdShield size={24} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.cardLabel}>Pending Approvals</span>
              <div className={styles.cardVal} style={{ color: 'var(--danger-text)' }}>
                {pendingCount} Awaiting
              </div>
              <span className={styles.kpiSub}>Requires owner sign-off</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className={styles.outletFilter} style={{ maxWidth: '340px' }}>
        <MdSearch size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search staff by username or email..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 'var(--font-size-base)', color: 'var(--text-main)' }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <MdClose size={16} />
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className={styles.sectionCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Shops</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyTable}>
                    {loading ? 'Loading staff records...' : 'No staff accounts found. Click "Provision New Cashier" to add team members.'}
                  </td>
                </tr>
              ) : (
                visibleStaff.map(u => {
                  const isActive = u.status === 'ACTIVE';
                  const isPending = u.status === 'PENDING';
                  const shopCount = (u.shops || []).length;

                  return (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.email || 'None provided'}</td>
                      <td>
                        <span style={{
                          fontSize: 'var(--font-size-sm)', fontWeight: 700,
                          padding: '3px 8px', borderRadius: '4px',
                          background: u.role === 'OWNER' ? 'var(--primary-light)' : 'var(--bg-subtle)',
                          color: u.role === 'OWNER' ? 'var(--primary)' : 'var(--text-secondary)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px',
                          fontSize: 'var(--font-size-sm)', fontWeight: 700,
                          background: isActive ? 'var(--success-bg)' : isPending ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: isActive ? 'var(--success-text)' : isPending ? 'var(--warning-text)' : 'var(--danger-text)'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        {u.role === 'OWNER' ? '—' : (
                          <span
                            title={(u.shops || []).map(s => s.name).join(', ') || 'No shops assigned'}
                            style={{ cursor: 'default' }}
                          >
                            {shopCount === 0 ? 'None' : `${shopCount} shop${shopCount > 1 ? 's' : ''}`}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {isPending && (
                            <button
                              onClick={() => handleApprove(u.id, u.username)}
                              className={styles.launchPosBtn}
                              style={{ padding: '6px 10px', fontSize: 'var(--font-size-sm)', background: 'var(--success)' }}
                            >
                              <MdCheck size={14} /> Approve
                            </button>
                          )}
                          {u.role !== 'OWNER' && isActive && (
                            <button
                              onClick={() => setShopModalStaff(u)}
                              className={styles.viewRowBtn}
                              title="Assign shops"
                              style={{ color: 'var(--primary)' }}
                            >
                              <MdStorefront size={14} />
                            </button>
                          )}
                          {u.role !== 'OWNER' && (
                            <button
                              onClick={() => handleToggleStatus(u.id, u.username)}
                              className={styles.viewRowBtn}
                              style={{ color: isActive ? 'var(--danger-text)' : 'var(--success-text)' }}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {u.role !== 'OWNER' && (
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              className={styles.viewRowBtn}
                              title="Delete user"
                              style={{ color: 'var(--danger-text)' }}
                            >
                              <MdDelete size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredStaff.length}
          onPageChange={setPage}
        />
      </div>

      <FormWizard
        open={showModal}
        title="Provision New Staff Account"
        steps={['Account details', 'Access']}
        step={formStep}
        onClose={() => setShowModal(false)}
        onBack={() => setFormStep(current => current - 1)}
        onNext={() => setFormStep(current => current + 1)}
        onSubmit={handleCreate}
        submitLabel="Create Account"
      >
        {formStep === 0 ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Cashier Username *
              <input placeholder="e.g. faith_cashier" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Staff Email
              <input type="email" placeholder="cashier@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Initial Password *
              <input type="password" placeholder="Enter an initial password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Role Assignment *
              <ExpandingSelect value={form.role} onChange={role => setForm({ ...form, role })} className={styles.selectControl} ariaLabel="Staff role" options={[
                { value: 'STAFF', label: 'Counter Cashier (POS & Sales Access)' },
                { value: 'OWNER', label: 'Full Shop Administrator (All Modules)' }
              ]} />
            </label>
          </div>
        )}
      </FormWizard>
    </div>
  );
}
