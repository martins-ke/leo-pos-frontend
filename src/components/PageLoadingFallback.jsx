import { useEffect, useState } from 'react';
import styles from './PageLoadingFallback.module.css';

export default function PageLoadingFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <main className={styles.page} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.visuallyHidden}>Loading page</span>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={`${styles.block} ${styles.brand}`} />
          <span className={`${styles.block} ${styles.headerAction}`} />
        </header>

        <section className={styles.content}>
          <div className={styles.intro}>
            <span className={`${styles.block} ${styles.title}`} />
            <span className={`${styles.block} ${styles.subtitle}`} />
          </div>

          <div className={styles.cards}>
            {[0, 1, 2].map(card => (
              <div className={styles.card} key={card}>
                <span className={`${styles.block} ${styles.cardLabel}`} />
                <span className={`${styles.block} ${styles.cardValue}`} />
                <span className={`${styles.block} ${styles.cardDetail}`} />
              </div>
            ))}
          </div>

          <div className={styles.panels}>
            <div className={`${styles.panel} ${styles.primaryPanel}`}>
              <span className={`${styles.block} ${styles.panelTitle}`} />
              <span className={`${styles.block} ${styles.panelContent}`} />
            </div>
            <div className={styles.panel}>
              <span className={`${styles.block} ${styles.panelTitle}`} />
              {[0, 1, 2].map(row => (
                <span className={`${styles.block} ${styles.panelRow}`} key={row} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
