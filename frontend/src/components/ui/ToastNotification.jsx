import { useEffect, useState } from "react";

/**
 * ToastNotification
 * Shows a sliding-in toast for new messages when the chat is not active.
 * Auto-dismisses after 4 seconds.
 */
export default function ToastNotification({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 4s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`toast-notification${visible ? " visible" : ""}`}
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
    >
      <div className="toast-icon">{toast.isGroup ? "👥" : "💬"}</div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-body">{toast.body}</div>
      </div>
      <button className="toast-close">✕</button>
    </div>
  );
}
