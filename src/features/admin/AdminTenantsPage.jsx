import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import {
  MdBusiness, MdStore, MdPointOfSale, MdSearch, MdRefresh, MdTrendingUp
} from 'react-icons/md';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import styles from '../dashboard/Dashboard.module.css';

const PAGE_SIZE = 15;

export default function AdminTenantsPage() {
  const { notify, beginSaving, confirm } = useFeedback();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        api.get('/admin/tenants/stats'),
        api.get('/admin/tenants')
      ]);

      if (statsRes.success) setStats(statsRes.body);
      if (tenantsRes.success) setTenants(tenantsRes.body);
      else notify({ type: 'error', message: tenantsRes.message || 'Could not load platform clients.' });
    } catch {
      notify({ type: 'error', message: 'Could not connect to SaaS Admin API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (tenant) => {
    const isDeactivating = tenant.status === 'ACTIVE';
    const confirmed = await confirm({
      title: `${isDeactivating ? 'Suspend' : 'Activate'} Tenant: "${tenant.username}"?`,
      message: isDeactivating
        ? 'Suspending this tenant prevents the owner and all their cashiers from accessing their POS till reactivated.'
        : 'Reactivating this tenant immediately restores full access.',
      confirmLabel: isDeactivating ? 'Suspend Access' : 'Activate Access',
      variant: isDeactivating ? 'danger' : 'primary'
    });

    if (!confirmed) return;

    const saveStatus = beginSaving({ title: 'Updating tenant subscription status' });
    try {
      const res = await api.patch(`/admin/tenants/${tenant.ownerId}/toggle-status`, {});
      if (res.success) {
        saveStatus.complete({ message: `Tenant "${tenant.username}" updated.` });
        loadData();
      } else {
        saveStatus.fail({ message: res.message || 'Status update failed.' });
      }
    } catch {
      saveStatus.fail({ message: 'Network error updating tenant.' });
    }
  };

  const filtered = tenants.filter(t =>
    (t.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.shopNames || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className={`${styles.container} ${styles.mobilePage}`}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.h1}>SaaS Customer & Tenant Manager</h1>
          <p>Monitor subscribed businesses, manage store owner licenses, and review platform-wide throughput</p>
        </div>
        <button className={styles.launchPosBtn} onClick={loadData} disabled={loading}>
          <MdRefresh size={18} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Platform-wide KPI cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MdBusiness size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Registered Businesses</span>
            <div className={styles.cardVal}>{stats?.totalBusinesses ?? 0} Clients</div>
            <span className={styles.kpiSub}>{stats?.activeBusinesses ?? 0} Active Subscribers</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <MdStore size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Total Outlets</span>
            <div className={styles.cardVal}>{stats?.totalOutlets ?? 0} Shops</div>
            <span className={styles.kpiSub}>Deployed nationwide</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
            <MdPointOfSale size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Counter Cashiers</span>
            <div className={styles.cardVal}>{stats?.totalCashiers ?? 0} Staff</div>
            <span className={styles.kpiSub}>Operating across counters</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <MdTrendingUp size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Platform Sales Volume</span>
            <div className={styles.cardVal}>KES {parseFloat(stats?.totalGrossProcessedVolume || 0).toLocaleString()}</div>
            <span className={styles.kpiSub}>{stats?.totalSalesTransactions ?? 0} Total Receipts</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={styles.outletFilter} style={{ maxWidth: '360px' }}>
        <MdSearch size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by owner, email, or shop..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 'var(--font-size-base)', color: 'var(--text-main)' }}
        />
      </div>

      {/* Tenants Table */}
      <div className={styles.sectionCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Business Owner</th>
                <th>Outlets / Shops</th>
                <th>Staff Count</th>
                <th>Total Volume</th>
                <th>License Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyTable}>
                    {loading ? 'Loading business subscribers...' : 'No business clients found.'}
                  </td>
                </tr>
              ) : (
                visible.map(t => {
                  const isActive = t.status === 'ACTIVE';
                  return (
                    <tr key={t.ownerId}>
                      <td>
                        <strong>{t.username}</strong>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                          {t.email || 'No email registered'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{t.shopCount} Outlets</span>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {(t.shopNames || []).join(', ') || 'No outlets created'}
                        </div>
                      </td>
                      <td>{t.cashierCount} Cashiers</td>
                      <td>
                        <strong>KES {parseFloat(t.totalVolume || 0).toLocaleString()}</strong>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {t.totalTransactions} transactions
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px',
                          fontSize: 'var(--font-size-sm)', fontWeight: 700,
                          background: isActive ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: isActive ? 'var(--success-text)' : 'var(--danger-text)'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={styles.viewRowBtn}
                          style={{ color: isActive ? 'var(--danger-text)' : 'var(--success-text)' }}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </button>
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
          totalItems={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
