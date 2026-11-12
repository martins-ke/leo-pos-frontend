import Spinner from './Spinner';
import styles from './LoadingOverlay.module.css';

export default function LoadingOverlay({ label }) {
  return (
    <div className={styles.overlay} aria-busy="true">
      <Spinner label={label} />
    </div>
  );
}