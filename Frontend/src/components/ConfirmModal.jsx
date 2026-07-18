import { useEffect } from "react";
import "./ConfirmModal.css";

/**
 * ConfirmModal — reusable confirmation dialog
 *
 * Props:
 *   isOpen      {boolean}  — whether modal is visible
 *   title       {string}   — bold heading
 *   message     {string}   — body text
 *   confirmText {string}   — confirm button label (default "Delete")
 *   cancelText  {string}   — cancel button label (default "Cancel")
 *   variant     {string}   — "danger" | "warning" | "info" (default "danger")
 *   onConfirm   {function} — called when confirm is clicked
 *   onCancel    {function} — called when cancel or backdrop is clicked
 */
export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    danger:  <i className="fa-solid fa-trash-can"></i>,
    warning: <i className="fa-solid fa-triangle-exclamation"></i>,
    info:    <i className="fa-solid fa-circle-info"></i>,
  };

  return (
    <div
      className="confirm-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Stop click propagation so clicking modal body doesn't close it */}
      <div
        className={`confirm-modal confirm-modal--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">{icons[variant]}</div>

        <h3 id="confirm-title" className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button
            className="confirm-btn confirm-btn--cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            className={`confirm-btn confirm-btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
