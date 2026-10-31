import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import {
  MdAdd, MdWarning, MdSearch, MdEdit, MdDelete,
  MdAddCircleOutline, MdClose, MdStore,
  MdTrendingUp
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import FormWizard from '../../components/forms/FormWizard';
import { useFeedback } from '../../context/useFeedback';
import sharedStyles from '../dashboard/Dashboard.module.css';
import pageStyles from './ProductsPage.module.css';

const styles = { ...sharedStyles, ...pageStyles };

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { notify, beginSaving, confirm } = useFeedback();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [page, setPage] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  // Form State
  const initialForm = {
    name: '',
    buyingPrice: '',
    sellingPrice: '',
    quantityInStock: '',
    minStockLevel: '5',
    unit: 'pcs'
  };
  const [form, setForm] = useState(initialForm);

  // Alerts
  const [loading, setLoading] = useState(false);

  const showAlert = (type, text) => {
    notify({ type, message: text });
  };

  const loadShops = async () => {
    try {
      const res = await api.get('/shops');
      if (res.success && res.body && res.body.length > 0) {
        setShops(res.body);
        if (!shopId) {
          setShopId(res.body[0].id);
        }
      } else if (!res.success) showAlert('error', res.message || 'Failed to load shops');
    } catch {
      showAlert('error', 'Could not connect to the server while loading shops');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = shopId ? `/products?shopId=${shopId}` : '/products';
      const res = await api.get(url);
      if (res.success && res.body) {
        setProducts(res.body);
      } else {
        setProducts([]);
        showAlert('error', res.message || 'Failed to load products');
      }
    } catch {
      showAlert('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      buyingPrice: parseFloat(form.buyingPrice),
      sellingPrice: parseFloat(form.sellingPrice),
      quantityInStock: parseFloat(form.quantityInStock),
      minStockLevel: parseFloat(form.minStockLevel),
      unit: form.unit.trim()
    };

    if (payload.sellingPrice < payload.buyingPrice) {
      const confirmed = await confirm({
        title: 'Selling below cost',
        message: 'The selling price is less than the buying price. Continue?',
        confirmLabel: 'Continue',
      });
      if (!confirmed) {
        return;
      }
    }

    const saveStatus = beginSaving({
      title: editingProduct ? 'Updating product' : 'Creating product',
    });
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, payload);
        if (res.success) {
          saveStatus.complete({ message: `Product "${payload.name}" was updated.` });
          setEditingProduct(null);
          setShowAddModal(false);
          setForm(initialForm);
          fetchProducts();
        } else {
          saveStatus.fail({ message: res.message || 'Could not update the product.' });
        }
      } else {
        const targetShop = shopId || (shops[0]?.id || '');
        const res = await api.post(`/products/${targetShop}`, payload);
        if (res.success) {
          saveStatus.complete({ message: `Product "${payload.name}" was created.` });
          setShowAddModal(false);
          setForm(initialForm);
          fetchProducts();
        } else {
          saveStatus.fail({ message: res.message || 'Could not create the product.' });
        }
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while saving the product.' });
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const qty = parseFloat(restockQty);
    if (!qty || qty <= 0) {
      showAlert('error', 'Please enter a valid positive quantity');
      return;
    }
    const saveStatus = beginSaving({ title: 'Restocking product' });
    try {
      const res = await api.patch(`/products/${restockProduct.id}/stock?quantity=${qty}`);
      if (res.success) {
        saveStatus.complete({ message: `Added ${qty} ${restockProduct.unit} to ${restockProduct.name}.` });
        setRestockProduct(null);
        setRestockQty('');
        fetchProducts();
      } else {
        saveStatus.fail({ message: res.message || 'Could not restock this product.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while restocking.' });
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: `Deactivate "${name}"?`,
      message: 'This product will no longer be available for sale.',
      confirmLabel: 'Deactivate',
      variant: 'danger',
    });
    if (!confirmed) return;
    const saveStatus = beginSaving({ title: 'Deactivating product' });
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.success) {
        saveStatus.complete({ message: `Product "${name}" was deactivated.` });
        fetchProducts();
      } else {
        saveStatus.fail({ message: res.message || 'Could not deactivate this product.' });
      }
    } catch {
      saveStatus.fail({ message: 'Could not connect to the server while deactivating this product.' });
    }
  };

  const openEditModal = (p) => {
    setFormStep(0);
    setEditingProduct(p);
    setForm({
      name: p.name,
      buyingPrice: p.buying_price || p.buyingPrice || '',
      sellingPrice: p.selling_price || p.sellingPrice || '',
      quantityInStock: p.quantity,
      minStockLevel: p.min_stock_level || p.minStockLevel || '5',
      unit: p.unit || 'pcs'
    });
    setShowAddModal(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isOut = p.quantity <= 0;
    const isLow = p.quantity > 0 && p.quantity <= (p.min_stock_level || p.minStockLevel);
    const isHealthy = p.quantity > (p.min_stock_level || p.minStockLevel);

    if (stockFilter === 'LOW') return matchesSearch && isLow;
    if (stockFilter === 'OUT') return matchesSearch && isOut;
    if (stockFilter === 'HEALTHY') return matchesSearch && isHealthy;
    return matchesSearch;
  });
  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const visibleProducts = filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(current => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const totalStockValue = products.reduce((acc, p) => acc + ((p.selling_price || p.sellingPrice || 0) * p.quantity), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((p.buying_price || p.buyingPrice || 0) * p.quantity), 0);
  const potentialProfit = totalStockValue - totalCostValue;

  return (
    <div className={`${styles.container} ${styles.mobilePage}`}>
      {/* Top Banner & Header */}
      <div className={styles.headerRow}>
        <div>
          <h1>Inventory & Catalog</h1>
          <p>Multi-outlet stock control, price margins, and replenishment tracking</p>
        </div>

        <div className={styles.headerActions}>
          <ExpandingSelect
            value={shopId}
            onChange={value => { setShopId(value); setPage(0); }}
            className={styles.outletSelect}
            ariaLabel="Filter products by outlet"
            startAdornment={<MdStore size={18} className={styles.receiptRef} />}
            options={[
              { value: '', label: 'All Outlets' },
              ...shops.map(shop => ({ value: shop.id, label: shop.name }))
            ]}
          />

          <div className={styles.inventoryAddActions}>
            <span className={styles.inventoryProductCount}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            <button
              className={styles.launchPosBtn}
              onClick={() => {
                setEditingProduct(null);
                setForm(initialForm);
                setFormStep(0);
                setShowAddModal(true);
              }}
            >
              <MdAdd size={20} />
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      </div>


      {/* Inventory KPI Summary */}
      <div className={`${styles.kpiGrid} ${styles.inventoryKpiGrid}`}>
        <div className={`${styles.kpiCard} ${styles.moneyKpiCard}`}>
          <div className={`${styles.cardIcon} ${pageStyles.inventoryKpiIcon}`} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <MdTrendingUp size={24} />
          </div>
          <div className={`${styles.kpiContent} ${pageStyles.inventoryKpiContent}`}>
            <span className={styles.cardLabel}>Retail Stock Value</span>
            <div className={`${styles.cardVal} ${styles.moneyValue} ${styles.positiveMoneyValue}`}>
              KES&nbsp;{Math.round(totalStockValue).toLocaleString()}
            </div>
            <span className={styles.kpiSub}>Estimated gross turnover value</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.moneyKpiCard}`}>
          <div className={`${styles.cardIcon} ${pageStyles.inventoryKpiIcon}`} style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
            <MdTrendingUp size={24} />
          </div>
          <div className={`${styles.kpiContent} ${pageStyles.inventoryKpiContent}`}>
            <span className={styles.cardLabel}>Projected Margin</span>
            <div className={`${styles.cardVal} ${styles.moneyValue} ${
              potentialProfit >= 0 ? styles.positiveMoneyValue : styles.negativeMoneyValue
            }`}>
              KES&nbsp;{Math.round(potentialProfit).toLocaleString()}
            </div>
            <span className={styles.kpiSub}>Gross profit potential</span>
          </div>
        </div>
      </div>

      {/* Search & Stock Level Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div className={styles.outletFilter} style={{ width: '320px', maxWidth: '100%' }}>
          <MdSearch size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search products by name..."
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

        <div className={styles.stockFilterList}>
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'HEALTHY', label: 'In Stock' },
            { id: 'LOW', label: 'Low Stock' },
            { id: 'OUT', label: 'Depleted' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setStockFilter(f.id); setPage(0); }}
              className={`${stockFilter === f.id ? styles.launchPosBtn : styles.viewRowBtn} ${styles.stockFilterButton}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className={styles.sectionCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Outlet</th>
                <th>Unit</th>
                <th>Cost (KES)</th>
                <th>Selling (KES)</th>
                <th>Margin</th>
                <th>In Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.emptyTable}>
                    {loading ? 'Loading catalog items...' : 'No products found. Click "Add New Product" to populate your catalog!'}
                  </td>
                </tr>
              ) : (
                visibleProducts.map(p => {
                  const buying = parseFloat(p.buying_price || p.buyingPrice || 0);
                  const selling = parseFloat(p.selling_price || p.sellingPrice || 0);
                  const margin = buying > 0 ? Math.round(((selling - buying) / buying) * 100) : 0;
                  const isOutOfStock = p.quantity <= 0;
                  const isLow = p.quantity > 0 && p.quantity <= (p.min_stock_level || p.minStockLevel);

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.shop?.name || 'Default Shop'}</td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td><span className={styles.moneyValue}>KES&nbsp;{buying.toLocaleString()}</span></td>
                      <td><strong className={styles.moneyValue}>KES&nbsp;{selling.toLocaleString()}</strong></td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: margin >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                          {margin >= 0 ? `+${margin}%` : `${margin}%`}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: 'var(--font-size-lg)', color: isOutOfStock ? 'var(--danger-text)' : isLow ? 'var(--warning-text)' : 'var(--text-main)' }}>
                          {p.quantity}
                        </strong>
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className={styles.method_CASH} style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                            Depleted
                          </span>
                        ) : isLow ? (
                          <span className={styles.method_CASH} style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--font-size-sm)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MdWarning size={14} /> Low ({p.quantity})
                          </span>
                        ) : (
                          <span className={styles.method_CASH} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                            Healthy
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockQty('');
                            }}
                            className={styles.viewRowBtn}
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                          >
                            <MdAddCircleOutline size={14} /> Restock
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className={styles.viewRowBtn}
                            title="Edit Product"
                          >
                            <MdEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className={styles.viewRowBtn}
                            style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                            title="Deactivate"
                          >
                            <MdDelete size={14} />
                          </button>
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
          totalItems={filteredProducts.length}
          onPageChange={setPage}
        />
      </div>

      <FormWizard
        open={showAddModal}
        title={editingProduct ? 'Edit Product Details' : 'Add New Inventory Item'}
        steps={['Product', 'Pricing', 'Stock']}
        step={formStep}
        onClose={() => setShowAddModal(false)}
        onBack={() => setFormStep(current => current - 1)}
        onNext={() => setFormStep(current => current + 1)}
        onSubmit={handleCreateOrUpdate}
        submitLabel={editingProduct ? 'Save Changes' : 'Create Product'}
      >
        {formStep === 0 && (
          <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Product Name *
            <input
              placeholder="e.g. Basmati Rice 2kg"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
            />
          </label>
        )}
        {formStep === 1 && (
          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Cost Price (KES) *
              <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.buyingPrice} onChange={e => setForm({ ...form, buyingPrice: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Selling Price (KES) *
              <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
          </div>
        )}
        {formStep === 2 && (
          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Initial Quantity *
              <input type="number" step="any" min="0" required placeholder="e.g. 50" value={form.quantityInStock} onChange={e => setForm({ ...form, quantityInStock: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Unit of Measure *
              <ExpandingSelect value={form.unit} onChange={unit => setForm({ ...form, unit })} className={styles.selectControl} ariaLabel="Product unit of measure" options={[
                { value: 'pcs', label: 'Pieces (pcs)' },
                { value: 'kg', label: 'Kilograms (kg)' },
                { value: 'litres', label: 'Litres (ltr)' },
                { value: 'bags', label: 'Bags / Sacks' },
                { value: 'packets', label: 'Packets / Tins' },
                { value: 'boxes', label: 'Boxes / Cartons' }
              ]} />
            </label>
            <label style={{ display: 'grid', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Low Stock Alert Level *
              <input type="number" min="0" required placeholder="e.g. 5" value={form.minStockLevel} onChange={e => setForm({ ...form, minStockLevel: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-base)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
            </label>
          </div>
        )}
      </FormWizard>

      {/* Restock Modal */}
      {restockProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '380px' }}>
            <div className={styles.modalHeader}>
              <h3>Quick Restock: {restockProduct.name}</h3>
              <button className={styles.closeBtn} onClick={() => setRestockProduct(null)}>
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', fontSize: 'var(--font-size-base)' }}>
                <div>Current Stock: <strong>{restockProduct.quantity} {restockProduct.unit}</strong></div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-md)' }}>Outlet: {restockProduct.shop?.name || 'Main Shop'}</div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-size-label)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Quantity to Add ({restockProduct.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  autoFocus
                  placeholder="e.g. 20"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: 'var(--font-size-lg)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className={styles.closeModalBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.launchPosBtn}
                  style={{ background: 'var(--success)' }}
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
