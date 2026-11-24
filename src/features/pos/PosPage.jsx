import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/api';
import { invalidateDashboardData } from '../../api/queryClient';
import { useAuth } from '../../context/useAuth';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import {
  MdSearch, MdDelete, MdPrint,
  MdClose, MdStore, MdCreditCard,
  MdPayments, MdPhoneIphone, MdRefresh,
  MdCheckCircle // Added for the approve button
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import styles from './PosPage.module.css';

const CATALOG_PAGE_SIZE = 24;
const CUSTOMER_PAGE_SIZE = 100;

export default function PosPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(() => localStorage.getItem('leo_active_shop') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogPage, setCatalogPage] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedCustomerCreditEligible, setSelectedCustomerCreditEligible] = useState(false);
  const [customerPage, setCustomerPage] = useState(0);
  const [customerHasNext, setCustomerHasNext] = useState(false);
  const [cart, setCart] = useState([]);
  const [amountTendered, setAmountTendered] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [recordAsDebt, setRecordAsDebt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Load shops and initial products
  const loadShops = async () => {
    setShopsLoading(true);
    try {
      const res = await api.get('/shops');
      if (res.success && res.body && res.body.length > 0) {
        setShops(res.body);
        if (!selectedShopId || !res.body.find(s => s.id === selectedShopId)) {
          setSelectedShopId(res.body[0].id);
          localStorage.setItem('leo_active_shop', res.body[0].id);
        }
      } else {
        setShops([]);
        setSelectedShopId('');
        localStorage.removeItem('leo_active_shop');
      }
    } catch {
      setShops([]);
      notify({ type: 'error', message: 'Could not connect to the server while loading shops.' });
    } finally {
      setShopsLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!selectedShopId) {
      setProducts([]);
      return;
    }
    try {
      const res = await api.get(`/products?shopId=${selectedShopId}`);
      if (res.success && res.body) {
        setProducts(res.body);
      } else {
        setProducts([]);
      }
    } catch {
      notify({ type: 'error', message: 'Could not load products inventory.' });
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (selectedShopId) {
      localStorage.setItem('leo_active_shop', selectedShopId);
    }
    loadProducts();
  }, [selectedShopId]);

  useEffect(() => {
    if (!selectedShopId) {
      setCustomers([]);
      setSelectedCustomerId('');
      setSelectedCustomerName('');
      setCustomerHasNext(false);
      return;
    }
    let active = true;
    setCustomers([]);
    api.get(`/customers?shopId=${encodeURIComponent(selectedShopId)}&page=${customerPage}&size=${CUSTOMER_PAGE_SIZE}`)
      .then(res => {
        if (!active) return;
        if (!res.success) {
          setCustomers([]);
          setCustomerHasNext(false);
          notify({ type: 'error', message: res.message || 'Could not load customer list.' });
          return;
        }
        const list = res.body?.content || [];
        setCustomers(list);
        setCustomerHasNext(res.body?.last === false);
      })
      .catch(() => {
        if (!active) return;
        setCustomers([]);
        setCustomerHasNext(false);
        notify({ type: 'error', message: 'Could not load customer list.' });
      });
    return () => {
      active = false;
    };
  }, [selectedShopId, customerPage]);

  // Auto-focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcut: '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isTypingField = target instanceof HTMLElement && (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      );

      if (e.key === '/' && !isTypingField && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToCart = (product, requestedQty = null) => {
    if (product.quantity <= 0) {
      notify({ type: 'error', message: `"${product.name}" is completely out of stock!` });
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    const defaultStep = product.unit?.toLowerCase().includes('kg') || product.unit?.toLowerCase().includes('lit') ? 0.25 : 1;
    const step = requestedQty !== null ? requestedQty : defaultStep;
    const currentQty = existing ? existing.qty : 0;

    if (currentQty + step > product.quantity) {
      notify({
        type: 'error',
        message: `Cannot add more. Only ${product.quantity} ${product.unit || 'units'} available in stock.`,
      });
      return;
    }

    if (existing) {
      setCart([
        { ...existing, qty: existing.qty + step },
        ...cart.filter(item => item.id !== product.id),
      ]);
    } else {
      setCart([{ ...product, qty: step }, ...cart]);
    }

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      searchInputRef.current?.focus();
    }
  };

  const updateQty = (id, newQty) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (newQty > product.quantity) {
      notify({
        type: 'error',
        message: `Maximum stock available for ${product.name} is ${product.quantity} ${product.unit || ''}`,
      });
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, qty: Math.round(newQty * 100) / 100 } : item));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setAmountTendered('');
    setRecordAsDebt(false);
  };

  const grandTotal = cart.reduce((sum, item) => sum + (parseFloat(item.selling_price || item.sellingPrice) * item.qty), 0);
  const numericTendered = parseFloat(amountTendered) || 0;
  const changeGiven = Math.max(0, numericTendered - grandTotal);

  const handleQuickCash = (amount) => {
    if (amount === 'EXACT') {
      setAmountTendered(grandTotal.toString());
    } else {
      setAmountTendered(amount.toString());
    }
  };

  const handleApproveCredit = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      // Note: Adjust endpoint if needed to match your backend
      const res = await api.patch(`/customers/${selectedCustomerId}/approve-credit`, {});
      if (res.success) {
        setSelectedCustomerCreditEligible(true);
        setCustomers(prev => prev.map(c => String(c.id) === String(selectedCustomerId) ? { ...c, creditEligible: true } : c));
        notify({ type: 'success', message: 'Customer approved for credit.' });
      } else {
        notify({ type: 'error', message: res.message || 'Failed to approve customer.' });
      }
    } catch {
      notify({ type: 'error', message: 'Network error approving customer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (asDebt = false) => {
    if (cart.length === 0) {
      notify({ type: 'error', message: 'Please add products to cart before checkout.' });
      return;
    }

    if (asDebt && (!selectedCustomerId || !selectedCustomerCreditEligible)) {
      notify({
        type: 'error',
        message: 'Select a customer approved for credit before recording this sale as a debt.',
      });
      return;
    }

    if (!asDebt && paymentMethod === 'CASH' && (!amountTendered || numericTendered < grandTotal)) {
      notify({
        type: 'error',
        message: `Insufficient cash tendered! Total due is KES ${grandTotal.toLocaleString()}`,
      });
      return;
    }

    setLoading(true);
    const tendered = asDebt ? 0 : paymentMethod === 'CASH' ? numericTendered : grandTotal;
    const calculatedChange = !asDebt && paymentMethod === 'CASH' ? changeGiven : 0;

    const payload = {
      shopId: selectedShopId || (shops[0]?.id || null),
      cashierId: user?.id || null,
      items: cart.map(i => ({
        productId: i.id,
        quantity: i.qty,
        unitPrice: parseFloat(i.selling_price || i.sellingPrice),
      })),
      grandTotal,
      amountTendered: tendered,
      changeGiven: calculatedChange,
      paymentMethod: asDebt ? 'DEBT' : paymentMethod,
      customerId: selectedCustomerId || undefined,
    };

    try {
      const res = await api.post('/sales', payload);
      if (res.success && res.body) {
        setLastSale(res.body);
        setCart([]);
        setAmountTendered('');
        setRecordAsDebt(false);
        setMobileCartOpen(false);
        loadProducts();
        invalidateDashboardData();
      } else {
        notify({ type: 'error', message: res.message || 'Checkout failed. Please verify stock.' });
      }
    } catch {
      notify({ type: 'error', message: 'Network connection error while processing sale.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const catalogPageCount = Math.ceil(filteredProducts.length / CATALOG_PAGE_SIZE);
  const visibleProducts = filteredProducts.slice(
    catalogPage * CATALOG_PAGE_SIZE,
    (catalogPage + 1) * CATALOG_PAGE_SIZE
  );

  useEffect(() => {
    setCatalogPage(current => Math.min(current, Math.max(0, catalogPageCount - 1)));
  }, [catalogPageCount]);

  const activeShopObj = shops.find(s => s.id === selectedShopId) || shops[0];
  
  // Determine if user has admin privileges to approve debt
  const canApproveDebt = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN';

  if (shopsLoading) {
    return (
      <div
        className={styles.posContainer}
        role="status"
        aria-live="polite"
        style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
          <span className={styles.spinner} />
          <p style={{ margin: 0 }}>Loading your shops...</p>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className={styles.posContainer}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '400px', background: 'var(--bg-card)', borderRadius: '12px', padding: '40px',
          textAlign: 'center', border: '1px solid var(--border-default)', margin: '20px auto', maxWidth: '560px'
        }}>
          <MdStore size={56} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.8 }} />
          <h2 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>No Managed Shops</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-md)', lineHeight: 1.6, marginBottom: '24px' }}>
            {user?.role === 'OWNER'
              ? 'You have not registered any shops yet. Please navigate to the Shops management tab to create your first outlet.'
              : 'Your account has not been assigned to any shop yet. Please contact your shop owner/manager to assign you to a register counter.'}
          </p>
          <button onClick={loadShops} className={styles.refreshBtn} style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--primary)', color: '#fff' }}>
            <MdRefresh size={18} style={{ marginRight: '6px' }} />
            Reload Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.posContainer}>
      {/* Top Banner / Outlet Switcher */}
      <div className={styles.topControl}>
        <div className={styles.shopSelector}>
          <span className={styles.storeLabel}>Register Counter:</span>
          <ExpandingSelect
            value={selectedShopId}
            onChange={value => {
              if (value === selectedShopId) return;
              clearCart();
              setAmountTendered('');
              setPaymentMethod('CASH');
              setRecordAsDebt(false);
              setMobileCartOpen(false);
              setSearchTerm('');
              setSelectedShopId(value);
              setCatalogPage(0);
              setCustomerPage(0);
              setSelectedCustomerId('');
              setSelectedCustomerName('');
              setSelectedCustomerCreditEligible(false);
            }}
            className={styles.shopSelect}
            ariaLabel="Select register outlet"
            startAdornment={<MdStore size={20} className={styles.storeIcon} />}
            options={shops.length === 0
              ? [{ value: '', label: 'Default Store' }]
              : shops.map(shop => ({ value: shop.id, label: `${shop.name} (${shop.type || 'Retail'})` }))}
          />
        </div>

        <div className={styles.counterMeta}>
          <span className={styles.cashierPill}>
            Cashier: <strong>{user?.username || 'Staff'}</strong>
          </span>
        </div>
      </div>

      <div className={styles.posGrid}>
        {/* Left Column: Catalog & Search */}
        <div className={styles.catalogSection}>
          <div className={styles.searchHeader}>
            <div className={styles.searchBar}>
              <MdSearch size={22} className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or search products... (Press '/' to focus)"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCatalogPage(0); }}
              />
              {searchTerm && (
                <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                  <MdClose size={16} />
                </button>
              )}
            </div>
            <ExpandingSelect
              value={selectedCustomerId}
              className={styles.customerSelect}
              ariaLabel="Link sale to a customer for purchase history"
              onChange={customerId => {
                const customer = customers.find(item => String(item.id) === customerId);
                setSelectedCustomerId(customerId);
                setSelectedCustomerName(customer?.name || '');
                setSelectedCustomerCreditEligible(Boolean(customer?.creditEligible));
              }}
              options={[
                { value: '', label: 'Walk-in sale (no customer linked)' },
                ...(selectedCustomerId && !customers.some(customer => String(customer.id) === selectedCustomerId)
                  ? [{ value: selectedCustomerId, label: selectedCustomerName }]
                  : []),
                ...customers.map(customer => ({
                  value: customer.id,
                  label: `${customer.name}${customer.creditEligible ? ' (credit approved)' : ''}`
                }))
              ]}
            />
            <PaginationControls
              page={customerPage}
              pageSize={CUSTOMER_PAGE_SIZE}
              totalItems={customers.length}
              hasNext={customerHasNext}
              onPageChange={setCustomerPage}
            />
          </div>

          <div className={styles.productGrid}>
            {filteredProducts.length === 0 ? (
              <div className={styles.noProducts}>
                <p>No products found matching "{searchTerm}"</p>
                <small>Try another keyword or select a different outlet</small>
              </div>
            ) : (
              visibleProducts.map(p => {
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity > 0 && p.quantity <= p.min_stock_level;
                const price = parseFloat(p.selling_price || p.sellingPrice || 0);

                return (
                  <button
                    type="button"
                    key={p.id}
                    className={`${styles.productCard} ${isOutOfStock ? styles.outOfStockCard : ''}`}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    aria-label={`${p.name}, ${price.toLocaleString()} KES, ${p.quantity} ${p.unit || 'pieces'} in stock`}
                  >
                    <div className={styles.pCardRow}>
                      <div className={styles.pName} title={p.name}>{p.name}</div>
                      <div className={styles.pPrice}>
                        <span className={styles.cur}>KES</span>
                        <span className={styles.val}>{price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={styles.pCardRow}>
                      <div className={styles.stockQuantity}>
                        <span>{p.quantity}</span>
                        <span className={styles.pUnit}>{p.unit || 'pcs'}</span>
                      </div>
                      {isOutOfStock ? (
                        <span className={styles.badgeOut}>Out of Stock</span>
                      ) : isLowStock ? (
                        <span className={styles.badgeLow}>Low Stock</span>
                      ) : (
                        <span className={styles.badgeIn}>In Stock</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <PaginationControls
            page={catalogPage}
            pageSize={CATALOG_PAGE_SIZE}
            totalItems={filteredProducts.length}
            onPageChange={setCatalogPage}
          />
        </div>

        <div
          className={`${styles.mobileBackdrop} ${mobileCartOpen ? styles.mobileBackdropOpen : ''}`}
          onClick={() => setMobileCartOpen(false)}
          aria-hidden="true"
        />

        {/* Right Column: Order Checkout Ticket */}
        <div className={`${styles.checkoutPanel} ${mobileCartOpen ? styles.checkoutPanelOpen : ''}`}>
          <div className={styles.checkoutHeader}>
            <div>
              <h2>Current Ticket</h2>
              <span className={styles.ticketCount}>{cart.length} unique item{cart.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.checkoutHeaderActions}>
              {cart.length > 0 && (
                <button className={styles.clearCartBtn} onClick={clearCart}>Clear</button>
              )}
              <button className={styles.mobileCartClose} onClick={() => setMobileCartOpen(false)} aria-label="Close cart">
                <MdClose size={20} />
              </button>
            </div>
          </div>

          <div className={styles.cartList}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <div className={styles.emptyIcon}>🛒</div>
                <p>Cart is currently empty</p>
                <span>Click products on the left or scan barcodes to begin sale</span>
              </div>
            ) : (
              cart.map(item => {
                const itemPrice = parseFloat(item.selling_price || item.sellingPrice || 0);
                const lineTotal = itemPrice * item.qty;
                const isDecimalUnit = item.unit?.toLowerCase().includes('kg') || item.unit?.toLowerCase().includes('lit');
                const step = isDecimalUnit ? 0.25 : 1;

                return (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.cartItemInfo}>
                      <div className={styles.cartItemName}>{item.name}</div>
                      <div className={styles.cartItemRate}>KES {itemPrice.toLocaleString()} / {item.unit || 'item'}</div>
                    </div>
                    <div className={styles.qtyController}>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty - step)} aria-label={`Decrease ${item.name}`}>−</button>
                      <input type="number" step={step} min="0" className={styles.qtyInput} value={item.qty} onChange={(e) => updateQty(item.id, parseFloat(e.target.value) || 0)} />
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty + step)} aria-label={`Increase ${item.name}`}>+</button>
                    </div>
                    <div className={styles.cartItemSubtotal}>KES {lineTotal.toLocaleString()}</div>
                    <button className={styles.removeLineBtn} onClick={() => removeFromCart(item.id)} title="Remove item" aria-label={`Remove ${item.name}`}>
                      <MdDelete size={17} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout Controls */}
          <div className={styles.checkoutFooter}>
            {!recordAsDebt && (
              <div className={styles.methodSelector}>
                <button type="button" className={`${styles.methodBtn} ${paymentMethod === 'CASH' ? styles.methodActive : ''}`} onClick={() => setPaymentMethod('CASH')}>
                  <MdPayments size={18} /><span>Cash</span>
                </button>
                <button type="button" className={`${styles.methodBtn} ${paymentMethod === 'MPESA' ? styles.methodActive : ''}`} onClick={() => { setPaymentMethod('MPESA'); setAmountTendered(grandTotal.toString()); }}>
                  <MdPhoneIphone size={18} /><span>M-Pesa</span>
                </button>
                <button type="button" className={`${styles.methodBtn} ${paymentMethod === 'CARD' ? styles.methodActive : ''}`} onClick={() => { setPaymentMethod('CARD'); setAmountTendered(grandTotal.toString()); }}>
                  <MdCreditCard size={18} /><span>Card</span>
                </button>
              </div>
            )}

            {!recordAsDebt && paymentMethod === 'CASH' && (
              <div className={styles.cashPresets}>
                <button type="button" onClick={() => handleQuickCash('EXACT')}>Exact</button>
                <button type="button" onClick={() => handleQuickCash(50)}>50</button>
                <button type="button" onClick={() => handleQuickCash(100)}>100</button>
                <button type="button" onClick={() => handleQuickCash(200)}>200</button>
                <button type="button" onClick={() => handleQuickCash(500)}>500</button>
              </div>
            )}

            <div className={styles.summaryBox}>
              <div className={styles.totalRow}>
                <span>TOTAL DUE</span>
                <span className={styles.totalValue}>KES {grandTotal.toLocaleString()}</span>
              </div>

              {!recordAsDebt && paymentMethod === 'CASH' && (
                <>
                  <div className={styles.tenderRow}>
                    <label>Amount Tendered</label>
                    <div className={styles.tenderInputWrap}>
                      <span>KES</span>
                      <input type="number" placeholder="0.00" value={amountTendered} onChange={e => setAmountTendered(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.changeRow}>
                    <span>Change Due</span>
                    <span className={styles.changeValue}>KES {changeGiven.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {recordAsDebt ? (
              <>
                <div className={styles.debtCheckoutNotice}>
                  <div>
                    This sale will be linked to {selectedCustomerName || 'the selected customer'} as an unpaid debt.
                    {selectedCustomerCreditEligible ? '' : ' Select a credit-approved customer to continue.'}
                  </div>
                  {/* Approve Debt Button (Admin Only) */}
                  {!selectedCustomerCreditEligible && selectedCustomerId && canApproveDebt && (
                    <button
                      type="button"
                      className={styles.approveDebtBtn}
                      onClick={handleApproveCredit}
                      disabled={loading}
                    >
                      <MdCheckCircle size={16} /> Approve Customer for Credit
                    </button>
                  )}
                </div>
                <div className={styles.checkoutActions}>
                  <button type="button" className={styles.debtCancelBtn} onClick={() => setRecordAsDebt(false)} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.checkoutBtn}
                    onClick={() => handleCheckout(true)}
                    disabled={cart.length === 0 || loading || !selectedCustomerId || !selectedCustomerCreditEligible}
                  >
                    {loading ? <><span className={styles.spinner} /> Recording…</> : `Record Debt · KES ${grandTotal.toLocaleString()}`}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.checkoutActions}>
                <button type="button" className={styles.checkoutBtn} onClick={() => handleCheckout(false)} disabled={cart.length === 0 || loading}>
                  {loading ? <><span className={styles.spinner} /> Processing…</> : `COMPLETE SALE: KES ${grandTotal.toLocaleString()}`}
                </button>
                <button type="button" className={styles.debtToggleBtn} onClick={() => setRecordAsDebt(true)} disabled={cart.length === 0 || loading} aria-pressed={false}>
                  Debt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile cart bar */}
      {cart.length > 0 && !mobileCartOpen && (
        <button type="button" className={styles.mobileCartBar} onClick={() => setMobileCartOpen(true)} aria-label={`View cart, ${cart.length} items, total KES ${grandTotal.toLocaleString()}`}>
          <span className={styles.mobileCartCount}>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
          <span className={styles.mobileCartTotal}>KES {grandTotal.toLocaleString()}</span>
          <span className={styles.mobileCartView}>View Cart →</span>
        </button>
      )}

      {/* Receipt Modal */}
      {lastSale && (
        <div className={styles.receiptOverlay}>
          <div className={styles.receiptModal}>
            <div className={styles.modalHeader}>
              <h3>{lastSale.paymentMethod === 'DEBT' ? 'Customer Debt Recorded' : 'Sale Completed Successfully!'}</h3>
              <button className={styles.closeBtn} onClick={() => setLastSale(null)}><MdClose size={20} /></button>
            </div>

            <div className={`receipt-printable ${styles.receiptPaper}`}>
              <div className={styles.receiptCenter}>
                <div className={styles.receiptLogo}>LEO POS</div>
                <div className={styles.receiptStore}>{lastSale.shop?.name || activeShopObj?.name || 'Retail Outlet'}</div>
                <div className={styles.receiptLoc}>{lastSale.shop?.location || activeShopObj?.location || 'Local Counter'}</div>
                <div className={styles.receiptDivider}>================================</div>
              </div>

              <div className={styles.receiptMeta}>
                <div>Receipt: #{lastSale.receiptNumber || lastSale.id}</div>
                <div>Date: {new Date(lastSale.createdAt || new Date().toISOString()).toLocaleString()}</div>
                <div>Cashier: {lastSale.cashier?.username || user?.username || 'Staff'}</div>
                {lastSale.customer?.name && <div>Customer: {lastSale.customer.name}</div>}
              </div>

              <div className={styles.receiptDivider}>--------------------------------</div>

              <table className={styles.receiptTable}>
                <thead><tr><th align="left">Item</th><th align="center">Qty</th><th align="right">Amount</th></tr></thead>
                <tbody>
                  {(lastSale.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td align="left">{it.productName || it.product?.name || 'Product'}</td>
                      <td align="center">{it.quantity}</td>
                      <td align="right">KES {it.subtotal || (it.quantity * it.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.receiptDivider}>================================</div>

              <div className={styles.receiptTotals}>
                <div className={styles.rRow}><strong>TOTAL</strong> <strong>KES {lastSale.grandTotal?.toLocaleString()}</strong></div>
                {lastSale.paymentMethod === 'DEBT' ? (
                  <div className={styles.rRow}><span>Amount owed</span> <span>KES {Number(lastSale.grandTotal).toLocaleString()}</span></div>
                ) : (
                  <>
                    <div className={styles.rRow}><span>Paid ({lastSale.paymentMethod})</span> <span>KES {lastSale.amountTendered?.toLocaleString()}</span></div>
                    <div className={styles.rRow}><span>Change</span> <span>KES {lastSale.changeGiven?.toLocaleString()}</span></div>
                  </>
                )}
              </div>

              <div className={styles.receiptDivider}>================================</div>

              <div className={styles.receiptFooter}><p>Thank you for your purchase!</p></div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.printBtn} onClick={() => window.print()}>
                <MdPrint size={18} /><span>Print Receipt</span>
              </button>
              <button type="button" className={styles.doneBtn} onClick={() => { setLastSale(null); clearCart(); searchInputRef.current?.focus(); }}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}