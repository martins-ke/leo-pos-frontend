import styles from './Spinner.module.css';

const sizeClasses = {
  hero: styles.hero,
  large: styles.large,
  small: styles.small,
};

export default function Spinner({ label, size = 'hero' }) {
  return (
    <div className={styles.spinner} role="status" aria-label={label}>
      <div className={`${styles.dial} ${sizeClasses[size] ?? sizeClasses.hero}`} aria-hidden="true">
        <span className={styles.track} />
        <span className={styles.arc} />
        <span className={styles.ticks} />
        <span className={styles.innerRing} />
        <span className={styles.core} />
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}