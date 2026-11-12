import { useEffect, useRef } from 'react';
import styles from './FeedbackOverlay.module.css';
import Spinner from '../Spinner';
import LoadingOverlay from '../LoadingOverlay';

const MESSAGE_ICONS = {
  success: 'OK',
  error: '!',
  warning: '!',
  info: 'i',
};

function MessageCard({ message, onDismiss }) {
  useEffect(() => {
    if (message.duration === 0) return undefined;
    const timeout = window.setTimeout(() => onDismiss(message.id), message.duration);
    return () => window.clearTimeout(timeout);
  }, [message.duration, message.id, onDismiss]);

  return (
    <article
      className={`${styles.messageCard} ${styles[message.type]}`}
      role={message.type === 'error' ? 'alert' : 'status'}
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.messageIcon} aria-hidden="true">{MESSAGE_ICONS[message.type]}</span>
      <div className={styles.messageContent}>
        {message.title && <strong className={styles.messageTitle}>{message.title}</strong>}
        <p>{message.message}</p>
      </div>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={() => onDismiss(message.id)}
        aria-label="Dismiss message"
      >
        x
      </button>
    </article>
  );
}

function Dialog({ dialog, onDismiss }) {
  const dialogElement = useRef(null);
  const isConfirmation = dialog.kind === 'confirm';
  const isAcknowledgement = dialog.kind === 'alert';
  const isLoading = dialog.kind === 'status' && dialog.phase === 'loading';
  const iconVariant = isLoading
    ? styles.loadingIcon
    : dialog.phase === 'error'
      ? styles.errorIcon
      : isConfirmation
        ? dialog.variant === 'danger' ? styles.dangerIcon : styles.confirmationIcon
        : '';

  useEffect(() => {
    const autofocusTarget = dialogElement.current?.querySelector('[data-autofocus]');
    (autofocusTarget ?? dialogElement.current)?.focus();
  }, [dialog.id]);

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && !isLoading && !isAcknowledgement) {
      event.preventDefault();
      onDismiss(false);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = dialogElement.current?.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      dialogElement.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={styles.dialogBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading && !isAcknowledgement) onDismiss(false);
      }}
    >
      <section
        ref={dialogElement}
        className={styles.dialog}
        role={isConfirmation || isAcknowledgement ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={`feedback-title-${dialog.id}`}
        aria-describedby={`feedback-message-${dialog.id}`}
        aria-busy={isLoading}
        tabIndex="-1"
        onKeyDown={onKeyDown}
      >
        <div className={`${styles.dialogIcon} ${iconVariant}`}>
          {isLoading ? <Spinner size="small" label={dialog.title} /> : (
            dialog.phase === 'error' ? '!' : isConfirmation ? '?' : 'OK'
          )}
        </div>
        <h2 id={`feedback-title-${dialog.id}`} className={styles.dialogTitle}>{dialog.title}</h2>
        <p id={`feedback-message-${dialog.id}`} className={styles.dialogMessage}>{dialog.message}</p>

        {isConfirmation ? (
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onDismiss(false)}
              data-autofocus
            >
              {dialog.cancelLabel}
            </button>
            <button
              type="button"
              className={dialog.variant === 'danger' ? styles.dangerButton : styles.primaryButton}
              onClick={() => onDismiss(true)}
            >
              {dialog.confirmLabel}
            </button>
          </div>
        ) : (
          !isLoading && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => onDismiss(false)}
              data-autofocus
            >
              {dialog.okLabel ?? 'OK'}
            </button>
          )
        )}
      </section>
    </div>
  );
}

export default function FeedbackOverlay({
  messages,
  dialog,
  loadingLabel,
  showRequestOverlay,
  onDismissMessage,
  onDismissDialog,
}) {
  return (
    <>
      {showRequestOverlay && <LoadingOverlay label={loadingLabel} />}
      <div className={styles.messageStack} aria-label="Notifications">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} onDismiss={onDismissMessage} />
        ))}
      </div>
      {dialog && <Dialog key={dialog.id} dialog={dialog} onDismiss={onDismissDialog} />}
    </>
  );
}
