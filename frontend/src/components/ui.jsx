import { useEffect } from "react";
import Icon from "./Icon.jsx";

export const Spinner = ({ lg }) => <span className={"spinner" + (lg ? " lg" : "")} role="progressbar" aria-label="Loading" />;

export const Skeleton = ({ h = 16, w = "100%", style }) => <div className="skeleton" style={{ height: h, width: w, ...style }} />;

export function PageHeader({ title, sub, children }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
      {children}
    </div>
  );
}

export function EmptyState({ icon = "search", title, text, action }) {
  return (
    <div className="card empty">
      <div className="ico"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card empty">
      <div className="ico" style={{ color: "var(--danger)" }}><Icon name="alert" size={22} /></div>
      <h3>Something went wrong</h3>
      <p>{message || "We could not load this data. Check that the backend is running."}</p>
      {onRetry && <button className="btn secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function ConfirmDialog({ open, title, text, confirmLabel = "Confirm", busy, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h3 id="dlg-title">{title}</h3>
        <p>{text}</p>
        <div className="actions">
          <button className="btn secondary" autoFocus onClick={onCancel}>Cancel</button>
          <button className="btn danger" disabled={busy} onClick={onConfirm}>{busy && <Spinner />}{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
