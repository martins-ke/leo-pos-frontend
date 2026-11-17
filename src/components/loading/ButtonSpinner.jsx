import styles from './ButtonSpinner.module.css';

export default function ButtonSpinner({ className = '', ariaLabel = 'Processing...' }) {
  return (
    <span
      className={`${styles.spinner} ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-hidden="true"
    />
  );
}
