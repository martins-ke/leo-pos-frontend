import { useEffect, useRef, useState } from 'react';
import styles from './FormWizard.module.css';
import buttonStyles from '../buttons/ActionButton.module.css';

export default function FormWizard({
  open,
  title,
  steps,
  step,
  onClose,
  onBack,
  onNext,
  onSubmit,
  submitLabel,
  submitting = false,
  embedded = false,
  children
}) {
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busy = submitting || isSubmitting;
  const isLastStep = step === steps.length - 1;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose, busy]);

  if (!open) return null;

  const handleNext = () => {
    if (!busy && formRef.current?.reportValidity()) onNext();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setIsSubmitting(true);
    try {
      await onSubmit(event);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={embedded ? styles.embeddedOverlay : styles.overlay}
      onMouseDown={event => {
        if (!embedded && event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className={`${styles.dialog} ${embedded ? styles.embeddedDialog : ''}`}
        role="dialog"
        aria-modal={!embedded}
        aria-labelledby="wizard-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="wizard-title">{title}</h2>
            <p>Step {step + 1} of {steps.length}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={busy} aria-label="Close form">
            ×
          </button>
        </header>
        <ol className={styles.stepper} aria-label="Form steps">
          {steps.map((label, index) => (
            <li className={index <= step ? styles.activeStep : ''} key={label}>
              <span>{index + 1}</span>
              <small>{label}</small>
            </li>
          ))}
        </ol>
        <form className={styles.form} ref={formRef} onSubmit={handleSubmit}>
          <div className={styles.body}>{children}</div>
          <footer className={`${styles.footer} ${step === 0 ? styles.footerFirstStep : ''}`}>
            <button
              type="button"
              className={`${buttonStyles.secondaryButton} ${styles.cancelButton}`}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            {step > 0 && (
              <button
                type="button"
                className={`${buttonStyles.secondaryButton} ${styles.backButton}`}
                onClick={onBack}
                disabled={busy}
              >
                Back
              </button>
            )}
            {isLastStep ? (
              <button
                type="submit"
                className={`${buttonStyles.primaryButton} ${styles.submitButton}`}
                disabled={busy}
              >
                {busy ? 'Saving...' : submitLabel}
              </button>
            ) : (
              <button
                type="button"
                className={`${buttonStyles.primaryButton} ${styles.submitButton}`}
                onClick={handleNext}
                disabled={busy}
              >
                Continue
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
