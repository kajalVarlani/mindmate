import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

/* ─────────────────────────────────────────────
   Single Toast bubble
───────────────────────────────────────────── */
function Toast({ message, type = "info", onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so CSS transition fires
    const enterTimer = setTimeout(() => setVisible(true), 10);

    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350); // wait for slide-out animation
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onClose]);

  const icons = {
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  };

  const handleManualClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  return (
    <div className={`toast toast--${type} ${visible ? "toast--visible" : ""}`}>
      <span className="toast__icon">{icons[type]}</span>
      <span className="toast__message">{message}</span>
      <button
        className="toast__close"
        onClick={handleManualClose}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {/* Progress bar */}
      <div
        className="toast__progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Context + Provider
───────────────────────────────────────────── */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   Hook
   Usage: const showToast = useToast();
          showToast("Saved!", "success");
          showToast("Something went wrong", "error");
          showToast("Please fill all fields", "warning");
          showToast("Tip: You can edit entries", "info");
───────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.showToast;
}

export default Toast;
