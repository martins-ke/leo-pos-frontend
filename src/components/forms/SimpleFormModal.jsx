import { useEffect, useState } from 'react';
import styles from './FormWizard.module.css';
import buttonStyles from '../buttons/ActionButton.module.css';

export default function SimpleFormModal({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel,
  submitting = false,
  children
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busy = submitting || isSubmitting;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="simple-form-title">
        <header className={styles.header}>
          <h2 id="simple-form-title">{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={busy} aria-label="Close form">
            ×
          </button>
        </header>
        <form
          className={styles.form}
          onSubmit={async event => {
            event.preventDefault();
            if (busy) return;
            setIsSubmitting(true);
            try {
              await onSubmit(event);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className={styles.body}>{children}</div>
          <footer className={styles.footer}>
            <button type="button" className={buttonStyles.secondaryButton} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className={buttonStyles.primaryButton} disabled={busy}>
              {busy ? 'Saving...' : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
