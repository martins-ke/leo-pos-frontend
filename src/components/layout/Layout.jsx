import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/useTheme';
import {
  MdCalendarToday, MdMenu, MdLightMode, MdDarkMode
} from 'react-icons/md';
import styles from './Layout.module.css';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className={styles.wrapper}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.hamburgerBtn}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle navigation drawer"
            >
              <MdMenu size={24} />
            </button>
          </div>

          <div className={styles.topbarRight}>
            {/* Theme Toggle Button */}
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <MdLightMode size={18} color="var(--theme-toggle-light)" />
              ) : (
                <MdDarkMode size={18} color="var(--theme-toggle-dark)" />
              )}
            </button>

            {/* Date Pill moved to the far right with a distinct vibrant color */}
            <div className={styles.dateBadge}>
              <MdCalendarToday size={14} className={styles.dateIcon} />
              <span>{currentDate}</span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
