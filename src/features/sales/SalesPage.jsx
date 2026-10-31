import { useState, useEffect } from 'react';
import { api } from '../../api/api';
import {
  MdReceipt, MdSearch, MdDownload, MdPrint, MdClose,
  MdStore, MdPayments, MdCalendarToday
} from 'react-icons/md';
import ExpandingSelect from '../../components/forms/ExpandingSelect';
import PaginationControls from '../../components/navigation/PaginationControls';
import { useFeedback } from '../../context/useFeedback';
import sharedStyles from '../dashboard/Dashboard.module.css';
import pageStyles from './SalesPage.module.css';

const styles = { ...sharedStyles, ...pageStyles };

const PAGE_SIZE = 20;

const sortSalesNewestFirst = (items) => [...items].sort((a, b) => {
  const aTime = Date.parse(a.createdAt);
  const bTime = Date.parse(b.createdAt);
  const aTimestamp = Number.isFinite(aTime) ? aTime : Number.NEGATIVE_INFINITY;
  const bTimestamp = Number.isFinite(bTime) ? bTime : Number.NEGATIVE_INFINITY;
  return bTimestamp - aTimestamp || String(b.id || '').localeCompare(String(a.id || ''));
});

export default function SalesPage() {
  const { notify } = useFeedback();
  const [sales, setSales] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const loadShops = async () => {
    try {
      const res = await api.get('/shops');
      if (res.success && res.body) setShops(res.body);
      else notify({ type: 'error', message: res.message || 'Could not load shops.' });
    } catch {
      notify({ type: 'error', message: 'Could not connect to the server while loading shops.' });
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const url = selectedShopId ? `/sales?shopId=${selectedShopId}` : '/sales';
      const res = await api.get(url);
      if (res.success && res.body) {
        setSales(sortSalesNewestFirst(res.body));
      } else {
        setSales([]);
        notify({ type: 'error', message: res.message || 'Could not load sales.' });
      }
    } catch {
      setSales([]);
      notify({ type: 'error', message: 'Could not connect to the server while loading sales.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    loadSales();
  }, [selectedShopId]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    if (dateFilter === 'TODAY' && saleDate < startOfToday) return false;
    if (dateFilter === 'WEEK' && saleDate < startOfWeek) return false;
    if (dateFilter === 'MONTH' && saleDate < startOfMonth) return false;

    const query = searchTerm.toLowerCase();
    const matchReceipt = (s.receiptNumber || s.id || '').toLowerCase().includes(query);
    const matchCashier = (s.cashier?.username || '').toLowerCase().includes(query);
    const customerName = s.customer?.name || '';
    const matchCustomer = customerName.toLowerCase().includes(query);
    const matchMethod = (s.paymentMethod || '').toLowerCase().includes(query);

    return matchReceipt || matchCashier || matchCustomer || matchMethod;
  });
  const pageCount = Math.ceil(filteredSales.length / PAGE_SIZE);
  const visibleSales = filteredSales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(current => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + (parseFloat(s.grandTotal) || 0), 0);
  const totalOrders = filteredSales.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const exportToCSV = () => {
    if (filteredSales.length === 0) return;
    const headers = ['Receipt #', 'Date Time', 'Outlet', 'Cashier', 'Customer', 'Items Count', 'Payment Method', 'Grand Total (KES)', 'Amount Tendered', 'Change Given'];
    const rows = filteredSales.map(s => [
      `"${s.receiptNumber || s.id}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
      `"${s.shop?.name || 'Main'}"`,
      `"${s.cashier?.username || 'Staff'}"`,
      `"${s.customer?.name || 'Walk-in'}"`,
      s.items ? s.items.length : 0,
      s.paymentMethod || 'CASH',
      s.grandTotal,
      s.amountTendered,
      s.changeGiven || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leo_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`${styles.container} ${styles.mobilePage}`}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1>Sales Ledger & Counter Audit</h1>
          <p>Complete historical registry of cashier receipts, payments, and counter checkouts</p>
        </div>

        <div className={styles.headerActions}>
          <ExpandingSelect
            value={selectedShopId}
            onChange={value => { setSelectedShopId(value); setPage(0); }}
            className={styles.outletSelect}
            ariaLabel="Filter sales by outlet"
            startAdornment={<MdStore size={18} className={styles.receiptRef} />}
            options={[
              { value: '', label: 'All Outlets' },
              ...shops.map(shop => ({ value: shop.id, label: shop.name }))
            ]}
          />

          <button
            className={styles.launchPosBtn}
            onClick={exportToCSV}
            disabled={filteredSales.length === 0}
            style={{ background: 'var(--success)' }}
          >
            <MdDownload size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>


      {/* KPI Cards */}
      <div className={`${styles.kpiGrid} ${styles.salesKpiGrid}`}>
        <div className={`${styles.kpiCard} ${styles.salesKpiCard}`}>
          <div className={`${styles.cardIcon} ${pageStyles.salesKpiIcon}`} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MdPayments size={24} />
          </div>
          <div className={`${styles.kpiContent} ${pageStyles.salesKpiContent}`}>
            <span className={`${styles.cardLabel} ${pageStyles.salesKpiLabel}`}>Period Revenue</span>
            <div className={`${styles.cardVal} ${styles.salesMoneyValue} ${pageStyles.salesKpiValue}`}>
              KES&nbsp;{Math.round(totalRevenue).toLocaleString()}
            </div>
            <span className={styles.kpiSub}>Filtered transaction value</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.salesKpiCard}`}>
          <div className={`${styles.cardIcon} ${pageStyles.salesKpiIcon}`} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <MdReceipt size={24} />
          </div>
          <div className={`${styles.kpiContent} ${pageStyles.salesKpiContent}`}>
            <span className={`${styles.cardLabel} ${pageStyles.salesKpiLabel}`}>Orders Settled</span>
            <div className={`${styles.cardVal} ${pageStyles.salesKpiValue}`}>{totalOrders} Receipts</div>
            <span className={styles.kpiSub}>Completed transactions</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.salesKpiCard}`}>
          <div className={`${styles.cardIcon} ${pageStyles.salesKpiIcon}`} style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
            <MdCalendarToday size={24} />
          </div>
          <div className={`${styles.kpiContent} ${pageStyles.salesKpiContent}`}>
            <span className={`${styles.cardLabel} ${pageStyles.salesKpiLabel}`}>Average Basket</span>
            <div className={`${styles.cardVal} ${styles.salesMoneyValue} ${pageStyles.salesKpiValue}`}>
              KES&nbsp;{Math.round(avgTicket).toLocaleString()}
            </div>
            <span className={styles.kpiSub}>Average ticket value</span>
          </div>
        </div>
      </div>

      {/* Search and Date Range Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div className={styles.outletFilter} style={{ width: '340px', maxWidth: '100%' }}>
          <MdSearch size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search receipt #, cashier, customer..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 'var(--font-size-base)', color: 'var(--text-main)' }}
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setPage(0); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <MdClose size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', overflow: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'All History' },
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'Past 7 Days' },
            { id: 'MONTH', label: 'This Month' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => { setDateFilter(p.id); setPage(0); }}
              className={dateFilter === p.id ? styles.launchPosBtn : styles.viewRowBtn}
              style={{ padding: '6px 14px', fontSize: 'var(--font-size-md)' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className={styles.sectionCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receipt Ref</th>
                <th>Date & Time</th>
                <th>Outlet</th>
                <th>Cashier</th>
                <th>Customer</th>
                <th>Lines</th>
                <th>Total</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.emptyTable}>
                    {loading ? 'Loading sales records...' : 'No transactions recorded matching the selected criteria.'}
                  </td>
                </tr>
              ) : (
                visibleSales.map(s => (
                  <tr key={s.id}>
                    <td>
                      <strong className={styles.receiptRef}>
                        #{s.receiptNumber || s.id?.substring(0, 8)}
                      </strong>
                    </td>
                    <td className={styles.timeCell}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </td>
                    <td>{s.shop?.name || 'Main Outlet'}</td>
                    <td>{s.cashier?.username || 'Counter Staff'}</td>
                    <td>{s.customer?.name || 'Walk-in'}</td>
                    <td>
                      <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {s.items ? s.items.length : 1}
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>KES {Number(s.grandTotal).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className={`${styles.methodPill} ${styles['method_' + (s.paymentMethod || 'CASH')]}`}>
                        {s.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={styles.viewRowBtn}
                        onClick={() => setActiveReceipt(s)}
                        title="View & Reprint Receipt"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MdReceipt size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredSales.length}
          onPageChange={setPage}
        />
      </div>

      {/* Thermal Receipt Modal */}
      {activeReceipt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Receipt #{activeReceipt.receiptNumber || activeReceipt.id}</h3>
              <button className={styles.closeBtn} onClick={() => setActiveReceipt(null)}>
                <MdClose size={20} />
              </button>
            </div>

            <div className="receipt-printable" style={{
              background: 'var(--receipt-bg)',
              border: '1px dashed var(--receipt-border)',
              padding: '16px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--receipt-text)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--font-size-2xl-plus)', fontWeight: 800 }}>LEO POS</h4>
                <div style={{ fontWeight: 700 }}>{activeReceipt.shop?.name || 'Retail Outlet'}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{activeReceipt.shop?.location || 'Local Counter'}</div>
                <div style={{ letterSpacing: '-1px', color: 'var(--border-strong)', margin: '4px 0' }}>================================</div>
              </div>

              <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.4, marginBottom: '8px' }}>
                <div>Receipt: #{activeReceipt.receiptNumber || activeReceipt.id}</div>
                <div>Date: {new Date(activeReceipt.createdAt).toLocaleString()}</div>
                <div>Cashier: {activeReceipt.cashier?.username || 'Staff'}</div>
                {activeReceipt.customer?.name && <div>Customer: {activeReceipt.customer.name}</div>}
              </div>

              <div style={{ letterSpacing: '-1px', color: 'var(--border-strong)', margin: '4px 0' }}>--------------------------------</div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr>
                    <th align="left">Item</th>
                    <th align="center">Qty</th>
                    <th align="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeReceipt.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td align="left">{it.productName || it.product?.name || 'Product'}</td>
                      <td align="center">{it.quantity}</td>
                      <td align="right">KES {it.subtotal || (it.quantity * it.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ letterSpacing: '-1px', color: 'var(--border-strong)', margin: '6px 0' }}>================================</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: 'var(--font-size-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>TOTAL:</span>
                  <span>KES {Number(activeReceipt.grandTotal).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paid ({activeReceipt.paymentMethod}):</span>
                  <span>KES {Number(activeReceipt.amountTendered).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Change:</span>
                  <span>KES {Number(activeReceipt.changeGiven || 0).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ letterSpacing: '-1px', color: 'var(--border-strong)', margin: '6px 0' }}>================================</div>
              <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                <p>Thank you for shopping with us!</p>
                <p>Leo POS Cloud Systems</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className={styles.printBtn}
                onClick={() => window.print()}
              >
                <MdPrint size={18} />
                <span>Print Copy</span>
              </button>
              <button
                className={styles.closeModalBtn}
                onClick={() => setActiveReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
