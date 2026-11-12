import { useCallback, useEffect, useRef, useState } from 'react';
import { FeedbackContext } from './FeedbackContext';
import FeedbackOverlay from '../components/feedback/FeedbackOverlay';

const DEFAULT_MESSAGE_DURATION = 6000;

export function FeedbackProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [dialog, setDialog] = useState(null);
  const dialogRef = useRef(null);
  const nextId = useRef(0);

  const replaceDialog = useCallback((nextDialog) => {
    const currentDialog = dialogRef.current;
    if (currentDialog?.kind === 'confirm') currentDialog.resolve(false);
    dialogRef.current = nextDialog;
    setDialog(nextDialog);
  }, []);

  const dismissDialog = useCallback((result = false) => {
    const currentDialog = dialogRef.current;
    if (!currentDialog) return;

    dialogRef.current = null;
    setDialog(null);
    if (currentDialog.kind === 'confirm') currentDialog.resolve(result);
  }, []);

  const notify = useCallback((options) => {
    const settings = typeof options === 'string' ? { message: options } : options;
    if (!settings || (settings.message == null && settings.title == null)) {
      throw new TypeError('notify requires a message or title');
    }
    const id = ++nextId.current;
    const type = ['success', 'error', 'warning', 'info'].includes(settings?.type)
      ? settings.type
      : 'info';

    setMessages((current) => [
      ...current,
      {
        id,
        type,
        title: settings?.title,
        message: settings?.message ?? '',
        duration: Number.isFinite(settings?.duration) && settings.duration >= 0
          ? Math.max(0, settings.duration)
          : DEFAULT_MESSAGE_DURATION,
      },
    ]);

    return id;
  }, []);

  const dismissMessage = useCallback((id) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const confirm = useCallback((options) => new Promise((resolve) => {
    replaceDialog({
      kind: 'confirm',
      id: ++nextId.current,
      title: options?.title ?? 'Are you sure?',
      message: options?.message ?? '',
      confirmLabel: options?.confirmLabel ?? 'Confirm',
      cancelLabel: options?.cancelLabel ?? 'Cancel',
      variant: options?.variant === 'danger' ? 'danger' : 'primary',
      resolve,
    });
  }), [replaceDialog]);

  const alert = useCallback((options) => {
    if (!options || (options.message == null && options.title == null)) {
      throw new TypeError('alert requires a message or title');
    }

    replaceDialog({
      kind: 'alert',
      id: ++nextId.current,
      phase: 'error',
      title: options.title ?? 'Important notice',
      message: options.message ?? '',
      okLabel: options.okLabel ?? 'OK',
    });
  }, [replaceDialog]);

  const beginSaving = useCallback((options = {}) => {
    const id = ++nextId.current;
    replaceDialog({
      kind: 'status',
      id,
      phase: 'loading',
      title: options?.title ?? 'Saving',
      message: options?.message ?? 'Please wait while your changes are saved.',
    });

    const finish = (phase, result = {}) => {
      if (dialogRef.current?.kind !== 'status' || dialogRef.current.id !== id) return;

      const currentDialog = dialogRef.current;
      const nextDialog = {
        ...currentDialog,
        phase,
        title: result.title ?? (phase === 'success' ? 'Saved' : 'Unable to save'),
        message: result.message ?? (
          phase === 'success'
            ? 'Your changes have been saved.'
            : 'Your changes could not be saved. Please try again.'
        ),
      };
      dialogRef.current = nextDialog;
      setDialog(nextDialog);
    };

    return {
      complete: (result) => finish('success', result),
      fail: (result) => finish('error', result),
      dismiss: () => {
        if (dialogRef.current?.id === id) dismissDialog();
      },
    };
  }, [dismissDialog, replaceDialog]);

  useEffect(() => () => {
    if (dialogRef.current?.kind === 'confirm') dialogRef.current.resolve(false);
  }, []);

  const value = { notify, alert, confirm, beginSaving };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackOverlay
        messages={messages}
        dialog={dialog}
        onDismissMessage={dismissMessage}
        onDismissDialog={dismissDialog}
      />
    </FeedbackContext.Provider>
  );
}
