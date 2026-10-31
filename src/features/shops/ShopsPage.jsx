import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import {
  MdAdd, MdStore, MdLocationOn, MdPointOfSale,
  MdDelete, MdBusiness
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import FormWizard from '../../components/forms/FormWizard';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import sharedStyles from '../dashboard/Dashboard.module.css';
import pageStyles from './ShopsPage.module.css';

const styles = { ...sharedStyles, ...pageStyles };
const PAGE_SIZE = 9;

export default function ShopsPage() {
  const { notify, beginSaving, confirm } = useFeedback();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [form, setForm] = useState({ name: '', type: 'Retail', location: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const showAlert = (type, text) => {
    notify({ type, message: text });
  };

  const loadShops = () => {
    setLoading(true);
    api.get('/shops')
      .then(res => {
        if (res.success && res.body) setShops(res.body);
        else showAlert('error', res.message || 'Could not load shops');
      })
      .catch(() => showAlert('error', 'Could not load shops'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadShops();
  }, []);

  const pageCount = Math.ceil(shops.length / PAGE_SIZE);
  const visibleShops = shops.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(current => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const saveStatus = beginSaving({ title: 'Creating outlet' });
    try {
      const res = await api.post('/shops', form);
      if (res.success) {
        saveStatus.complete({ message: `Shop outlet "${form.name}" was created.` });
        setShowModal(false);
        setForm({ name: '', type: 'Retail', location: '', description: '' });
        setPage(0);
        loadShops();
      } else {
        saveStatus.fail({ message: res.message || 'Could not create the outlet.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while creating the outlet.' });
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: `Delete "${name}"?`,
      message: 'Existing inventory may be affected.',
      confirmLabel: 'Delete outlet',
      variant: 'danger',
    });
    if (!confirmed) return;
    const saveStatus = beginSaving({ title: 'Deleting outlet' });
    try {
      const res = await api.delete(`/shops/${id}`);
      if (res.success) {
        saveStatus.complete({ message: `Outlet "${name}" was deleted.` });
        loadShops();
      } else {
        saveStatus.fail({ message: res.message || 'Could not delete the outlet.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while deleting the outlet.' });
    }
  };

  const launchPosForShop = (shopId) => {
    localStorage.setItem('leo_active_shop', shopId);
    navigate('/pos');
  };

  return (
    <div className={`${styles.container} ${styles.mobilePage}`}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1>Branch & Shop Outlets</h1>
          <p>Manage multi-branch retail doors, physical locations, and counter registers</p>
        </div>

        <button
          className={styles.launchPosBtn}
          onClick={() => {
            setFormStep(0);
            setShowModal(true);
          }}
        >
          <MdAdd size={20} />
          <span>New Shop Outlet</span>
        </button>
      </div>


      {/* Outlets Grid */}
      <div className={styles.outletGrid}>
        {shops.length === 0 ? (
          <div className={styles.sectionCard} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px' }}>
            <MdBusiness size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>{loading ? 'Loading outlets...' : 'No Shop Outlets Configured'}</h3>
            {!loading && (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-base)', margin: '0 0 16px' }}>Create your first store branch or retail outlet to begin managing stock.</p>
                <button
                  className={styles.launchPosBtn}
                  onClick={() => {
                    setFormStep(0);
                    setShowModal(true);
                  }}
                  style={{ margin: '0 auto' }}
                >
                  <MdAdd size={18} />
                  <span>Create First Outlet</span>
                </button>
              </>
            )}
          </div>
        ) : (
          visibleShops.map(s => (
            <div
              key={s.id}
              className={`${styles.sectionCard} ${styles.outletCard}`}
            >
              <div>
                <div className={styles.outletHeader}>
                  <div className={styles.outletIdentity}>
                    <div className={styles.cardIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '42px', height: '42px' }}>
                      <MdStore size={24} />
                    </div>
                    <div className={styles.outletDetails}>
                      <h3 className={styles.outletTitle}>{s.name}</h3>
                      <span className={styles.roleChip}>
                        {s.type || 'Retail'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    title="Delete Outlet"
                    className={styles.outletDelete}
                  >
                    <MdDelete size={18} />
                  </button>
                </div>

                <div className={styles.outletLocation}>
                  <MdLocationOn size={16} />
                  <span>{s.location || 'Local Business Premises'}</span>
                </div>

                <p className={styles.outletDescription}>
                  {s.description || 'Primary customer walk-in trading outlet.'}
                </p>
              </div>

              <div className={styles.outletFooter}>
                <span className={styles.outletId}>ID: {s.id}</span>
                <button
                  onClick={() => launchPosForShop(s.id)}
                  className={`${styles.launchPosBtn} ${styles.outletLaunch}`}
                >
                  <MdPointOfSale size={15} />
                  <span>Launch POS</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={shops.length}
        onPageChange={setPage}
      />

      <FormWizard
        open={showModal}
        title="Register New Store Outlet"
        steps={['Outlet', 'Location']}
        step={formStep}
        onClose={() => setShowModal(false)}
        onBack={() => setFormStep(current => current - 1)}
        onNext={() => setFormStep(current => current + 1)}
        onSubmit={handleCreate}
        submitLabel="Create Outlet"
      >
        {formStep === 0 ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Shop / Outlet Name *
              <input placeholder="e.g. Central Town Branch" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Business Category *
              <ExpandingSelect value={form.type} onChange={type => setForm({ ...form, type })} className={styles.selectControl} ariaLabel="Business category" options={[
                { value: 'Retail', label: 'General Retail Store' },
                { value: 'Supermarket', label: 'Mini-mart / Supermarket' },
                { value: 'Hardware', label: 'Hardware Supplies' },
                { value: 'Agrovet', label: 'Agrovet Supplies' },
                { value: 'Pharmacy', label: 'Chemist / Pharmacy' },
                { value: 'Wholesale', label: 'Wholesale Depot' },
                { value: 'Other', label: 'Other Business' }
              ]} />
            </label>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Location Address / Town
              <input placeholder="e.g. Nakuru CBD, Kenyatta Avenue" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Notes & Description
              <textarea placeholder="Notes regarding operational hours, store supervisor, contact info..." rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
          </div>
        )}
      </FormWizard>
    </div>
  );
}
