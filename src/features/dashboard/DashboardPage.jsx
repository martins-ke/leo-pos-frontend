import { useEffect, useState } from 'react';
import { api } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import {
  MdTrendingUp, MdStore, MdArrowForward, MdPointOfSale, MdCheckCircle, MdPrint, MdClose
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import { useFeedback } from '../../context/useFeedback';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { notify } = useFeedback();
  const navigate = useNavigate();
  const [data, setData] = useState({
    todayRevenue: 0,
    todayGrossProfit: 0,
    monthRevenue: 0,
    monthGrossProfit: 0,
    todayCashCollected: 0,
    todayMpesaCollected: 0,
    todayCardCollected: 0,
    todayBankTransferCollected: 0,
    todayNetProfit: 0,
    monthNetProfit: 0,
    totalSalesToday: 0,
    totalProducts: 0,
    lowStockCount: 0,
    recentSales: [],
    lowStockProducts: []
  });
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewReceipt, setViewReceipt] = useState(null);

  const fetchDashboardData = () => {
    setLoading(true);
    const url = selectedShopId ? `/dashboard/summary?shopId=${selectedShopId}` : '/dashboard/summary';
    api.get(url)
      .then(res => {
        if (res.success && res.body) {
          setData(res.body);
        } else {
          notify({ type: 'error', message: res.message || 'Could not load dashboard data.' });
        }
      })
      .catch(() => notify({ type: 'error', message: 'Could not connect to the server while loading dashboard data.' }))
      .finally(() => setLoading(false));
  };

  const loadShops = () => {
    api.get('/shops')
      .then(res => {
        if (res.success && res.body) setShops(res.body);
        else notify({ type: 'error', message: res.message || 'Could not load shops.' });
      })
      .catch(() => notify({ type: 'error', message: 'Could not connect to the server while loading shops.' }));
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedShopId]);

  const todayCollected = [
    data.todayCashCollected,
    data.todayMpesaCollected,
    data.todayCardCollected,
    data.todayBankTransferCollected,
  ].reduce((total, amount) => total + Number(amount || 0), 0);

  return (
    <div className={styles.container}>
      {/* Header with Title and Outlet Filter */}
      <div className={styles.headerRow}>
        <div>
          <h1>Dashboard</h1>
          <p>Real-time analytics, sales volume, and stock status across your retail network</p>
        </div>

        <div className={styles.headerActions}>
          <ExpandingSelect
            value={selectedShopId}
            onChange={setSelectedShopId}
            className={styles.outletSelect}
            ariaLabel="Filter dashboard by outlet"
            startAdornment={<MdStore size={18} className={styles.receiptRef} />}
            options={[
              { value: '', label: 'All Business Outlets' },
              ...shops.map(shop => ({ value: shop.id, label: shop.name }))
            ]}
          />

          <button className={styles.launchPosBtn} onClick={() => navigate('/owner/pos')}>
            <MdPointOfSale size={18} />
            <span>Open POS Counter</span>
          </button>
        </div>
      </div>


      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MdTrendingUp size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Revenue &amp; Gross Profit</span>
            <div className={styles.metricPeriod}>
              <span className={styles.kpiSub}>Today</span>
              <div className={styles.cardVal}>KES <strong>{Number(data.todayRevenue || 0).toLocaleString()}</strong></div>
              <span className={styles.kpiSub}>Gross profit: <strong>KES {Number(data.todayGrossProfit || 0).toLocaleString()}</strong></span>
            </div>
            <div className={styles.metricPeriod}>
              <span className={styles.kpiSub}>This month</span>
              <div className={styles.cardVal}>KES <strong>{Number(data.monthRevenue || 0).toLocaleString()}</strong></div>
              <span className={styles.kpiSub}>Gross profit: <strong>KES {Number(data.monthGrossProfit || 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <MdPointOfSale size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Actual collected today</span>
            <div className={styles.cardVal}>KES <strong>{todayCollected.toLocaleString()}</strong></div>
            <div className={styles.collectionBreakdown}>
              <span>Cash <strong>KES {Number(data.todayCashCollected || 0).toLocaleString()}</strong></span>
              <span>M-Pesa <strong>KES {Number(data.todayMpesaCollected || 0).toLocaleString()}</strong></span>
              <span>Card <strong>KES {Number(data.todayCardCollected || 0).toLocaleString()}</strong></span>
              {Number(data.todayBankTransferCollected || 0) > 0 && (
                <span>Bank transfer <strong>KES {Number(data.todayBankTransferCollected || 0).toLocaleString()}</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.cardIcon} style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
            <MdCheckCircle size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.cardLabel}>Net Profit</span>
            <div className={styles.metricPeriod}>
              <span className={styles.kpiSub}>Today</span>
              <div className={styles.cardVal}>KES <strong>{Number(data.todayNetProfit || 0).toLocaleString()}</strong></div>
            </div>
            <div className={styles.metricPeriod}>
              <span className={styles.kpiSub}>This month</span>
              <div className={styles.cardVal}>KES <strong>{Number(data.monthNetProfit || 0).toLocaleString()}</strong></div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Split Section: Recent Transactions + Low Stock Radar */}
      <div className={styles.splitGrid}>
        {/* Recent Transactions Section */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Recent Sales Ledger</h2>
              <span className={styles.sectionSubtitle}>Last transactions logged by counter cashiers</span>
            </div>
            <button className={styles.viewAllBtn} onClick={() => navigate('/sales')}>
              <span>View Full Ledger</span>
              <MdArrowForward size={16} />
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Receipt Ref</th>
                  <th>Outlet</th>
                  <th>Cashier</th>
                  <th>Total</th>
                  <th>Method</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentSales || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyTable}>
                      {loading ? 'Loading sales data...' : 'No sales recorded yet. Ring up a sale in POS to see it live!'}
                    </td>
                  </tr>
                ) : (
                  data.recentSales.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong className={styles.receiptRef}>
                          #{s.receiptNumber || s.id?.substring(0, 8)}
                        </strong>
                      </td>
                      <td>{s.shopName || 'Main'}</td>
                      <td>{s.cashierName || 'Cashier'}</td>
                      <td>
                        <span className={styles.amountBadge}>KES {Number(s.grandTotal).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`${styles.methodPill} ${styles['method_' + (s.paymentMethod || 'CASH')]}`}>
                          {s.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td className={styles.timeCell}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </td>
                      <td>
                        <button
                          className={styles.viewRowBtn}
                          onClick={() => setViewReceipt(s)}
                          title="View receipt summary"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 style={{ whiteSpace: 'nowrap'}}>Critical Stock Watch</h2>
            </div>
            <button className={styles.viewAllBtn} onClick={() => navigate('/products')}>
              <span>Manage All</span>
              <MdArrowForward size={16} />
            </button>
          </div>

          <div className={styles.lowStockList}>
            {(data.lowStockProducts || []).length === 0 ? (
              <div className={styles.healthyStockState}>
                <MdCheckCircle size={36} color="var(--success)" />
                <p>All stock levels are optimal!</p>
                <span>No products are below minimum thresholds.</span>
              </div>
            ) : (
              data.lowStockProducts.map(p => (
                <div key={p.id} className={styles.stockItemCard}>
                  <div className={styles.stockItemMeta}>
                    <div className={styles.stockItemName}>{p.name}</div>
                    <div className={styles.stockItemOutlet}>
                      {p.shop?.name || 'Main Shop'} • Min Alert: {p.min_stock_level} {p.unit}
                    </div>
                  </div>

                  <div className={styles.stockItemRight}>
                    <div className={styles.stockQtyPill}>
                      <strong>{p.quantity}</strong> {p.unit} left
                    </div>
                    <button
                      className={styles.quickRestockBtn}
                      onClick={() => navigate('/products')}
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {viewReceipt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Receipt #{viewReceipt.receiptNumber || viewReceipt.id}</h3>
              <button className={styles.closeBtn} onClick={() => setViewReceipt(null)}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="receipt-printable" style={{ padding: '16px', background: 'var(--receipt-bg)', borderRadius: '8px', border: '1px dashed var(--receipt-border)' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--font-size-3xl-minus)', fontWeight: 800 }}>LEO POS RECEIPT</h4>
                <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-muted)' }}>Outlet: {viewReceipt.shopName || 'Main'}</div>
                <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-muted)' }}>Date: {new Date(viewReceipt.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-strong)', borderBottom: '1px dashed var(--border-strong)', padding: '12px 0', margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>
                  <span>Total Amount:</span>
                  <span>KES {Number(viewReceipt.grandTotal).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-base)', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>Payment Method:</span>
                  <span>{viewReceipt.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-base)', color: 'var(--text-muted)' }}>
                  <span>Processed by:</span>
                  <span>{viewReceipt.cashierName}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Verified Official POS Record
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className={styles.printBtn} onClick={() => window.print()}>
                <MdPrint size={16} /> Print
              </button>
              <button className={styles.closeModalBtn} onClick={() => setViewReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
