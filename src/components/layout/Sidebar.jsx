import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import LeoMark from '../branding/LeoMark';
import {
  MdDashboard, MdStore, MdInventory2, MdPointOfSale,
  MdPeople, MdReceipt, MdLogout, MdAccountBalanceWallet, MdPayments,
  MdMoneyOff, MdInventory, MdExpandLess, MdExpandMore
} from 'react-icons/md';
import styles from './Sidebar.module.css';

const ownerLinks = [
  { to: '/owner/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
  { to: '/owner/pos', label: 'POS Register', icon: <MdPointOfSale /> },
  { to: '/owner/products', label: 'Inventory', icon: <MdInventory2 /> },
  { to: '/owner/sales', label: 'Sales Ledger', icon: <MdReceipt /> },
  {
    label: 'Customers & Debts',
    icon: <MdPeople />,
    children: [
      { to: '/owner/customers', label: 'Customers', icon: <MdPeople /> },
      { to: '/owner/debts', label: 'Customer Debts', icon: <MdPayments /> },
    ],
  },
  {
    label: 'Expenses & Stock Use',
    icon: <MdMoneyOff />,
    children: [
      { to: '/owner/expenses', label: 'Expenses', icon: <MdMoneyOff /> },
      { to: '/owner/stock-use', label: 'Stock Use', icon: <MdInventory /> },
    ],
  },
  { to: '/owner/accounts', label: 'Shop Account', icon: <MdAccountBalanceWallet /> },
  { to: '/owner/shops', label: 'Outlets & Shops', icon: <MdStore /> },
  { to: '/owner/staff', label: 'Staff & Team', icon: <MdPeople /> },
];

const clientLinks = [
  { to: '/client/pos', label: 'POS Register', icon: <MdPointOfSale /> },
  { to: '/client/sales', label: 'Recent Receipts', icon: <MdReceipt /> },
  {
    label: 'Customers & Debts',
    icon: <MdPeople />,
    children: [
      { to: '/client/customers', label: 'Customers', icon: <MdPeople /> },
      { to: '/client/debts', label: 'Customer Debts', icon: <MdPayments /> },
    ],
  },
];

const platformLinks = [
  { to: '/owner/admin/tenants', label: 'Shop Accounts', icon: <MdStore /> },
];

export default function Sidebar({ isOpen, onCloseMobile, variant = 'owner' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = variant === 'platform'
    ? platformLinks
    : variant === 'client'
      ? clientLinks
      : ownerLinks;
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const activeGroups = Object.fromEntries(
      links
        .filter(({ children }) => children?.some(({ to }) => to === location.pathname))
        .map(({ label }) => [label, true])
    );
    if (Object.keys(activeGroups).length > 0) {
      setExpandedGroups((current) => ({ ...current, ...activeGroups }));
    }
  }, [links, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(variant === 'platform' ? '/platform/login' : variant === 'owner' ? '/owner/login' : '/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className={styles.backdrop} onClick={onCloseMobile} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarMobileOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandLeft}>
            <div className={styles.brandIcon}><LeoMark /></div>
            <div className={styles.brandText}>
              <div className={styles.logoRow}>
                <span className={styles.logo}>Leo</span>
                <span className={styles.tagline}>POS</span>
              </div>
              <span className={styles.versionBadge}>PRO ENTERPRISE</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSectionLabel}>MAIN MENU</div>
          {links.map(({ to, label, icon, children }) => {
            if (children) {
              const isActive = children.some(({ to: childTo }) => childTo === location.pathname);
              const isExpanded = Boolean(expandedGroups[label]);
              const groupId = `sidebar-group-${label.replaceAll(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;

              return (
                <div className={styles.group} key={label}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={groupId}
                    onClick={() => setExpandedGroups((current) => ({
                      ...current,
                      [label]: !current[label],
                    }))}
                    className={`${styles.groupToggle} ${isActive ? styles.groupActive : ''}`}
                  >
                    <span className={styles.icon}>{icon}</span>
                    <span className={styles.label}>{label}</span>
                    <span className={styles.groupChevron}>
                      {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className={styles.groupChildren} id={groupId}>
                      {children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => onCloseMobile && onCloseMobile()}
                          className={({ isActive: childIsActive }) =>
                            `${styles.link} ${styles.childLink} ${childIsActive ? styles.active : ''}`
                          }
                        >
                          <span className={styles.icon}>{child.icon}</span>
                          <span className={styles.label}>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => onCloseMobile && onCloseMobile()}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.icon}>{icon}</span>
                <span className={styles.label}>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userCard} title={`${user?.username || 'User'} (${user?.role || 'STAFF'})`}>
            <div className={styles.avatar}>{getInitials(user?.username)}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.username || 'User'}</span>
              <span className={styles.userRole}>{user?.role || 'STAFF'}</span>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout} title="Log Out">
            <MdLogout size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
