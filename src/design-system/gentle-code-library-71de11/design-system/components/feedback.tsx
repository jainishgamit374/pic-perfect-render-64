import { forwardRef, useEffect, useId, type HTMLAttributes, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button, IconButton } from "./actions";

export type FeedbackTone = "info" | "success" | "warning" | "error";
const ICONS: Record<FeedbackTone, ReactNode> = {
  info: <Info aria-hidden />,
  success: <CheckCircle2 aria-hidden />,
  warning: <AlertTriangle aria-hidden />,
  error: <AlertCircle aria-hidden />,
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: FeedbackTone;
  title?: ReactNode;
}

/** Inline, persistent message inside a page or form. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert({ tone = "info", title, children, className, ...props }, ref) {
  return (
    <div ref={ref} role={tone === "error" ? "alert" : "status"} className={cn("ds-alert", `ds-alert--${tone}`, className)} {...props}>
      {ICONS[tone]}
      <div>
        {title && <div className="ds-alert__title">{title}</div>}
        {children && <div className="ds-alert__body">{children}</div>}
      </div>
    </div>
  );
});

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  onDismiss?: () => void;
}

/** Transient confirmation. Render bottom-right, auto-dismiss after 3–5s. */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast({ tone = "success", onDismiss, children, className, ...props }, ref) {
  return (
    <div ref={ref} role="status" className={cn("ds-toast", `ds-toast--${tone}`, className)} {...props}>
      {ICONS[tone]}
      <span className="ds-toast__msg">{children}</span>
      {onDismiss && <IconButton label="Dismiss" size="sm" icon={<X />} onClick={onDismiss} />}
    </div>
  );
});

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: "text" | "block" | "circle";
  width?: string | number;
}

/** Default loading treatment for content. */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton({ shape = "text", width, className, style, ...props }, ref) {
  return <div ref={ref} aria-hidden className={cn("ds-skeleton", `ds-skeleton--${shape}`, className)} style={{ width, ...style }} {...props} />;
});

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Never show a blank page — use this with one clear next action. */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState({ icon, title, description, action, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn("ds-empty", className)} {...props}>
      <div className="ds-empty__icon" aria-hidden>{icon}</div>
      <h3 className="ds-h3">{title}</h3>
      {description && <p className="ds-body ds-empty__desc">{description}</p>}
      {action}
    </div>
  );
});

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "full";
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Dialog. sm 480 · md 640 · lg 1000 · full for image inspection / large uploads. */
export function Modal({ open, onClose, title, description, size = "md", footer, children, className }: ModalProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ds-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn("ds-modal", `ds-modal--${size}`, className)}>
        <div className="ds-modal__head">
          <div>
            <h2 id={titleId} className="ds-h3">{title}</h2>
            {description && <p className="ds-body-sm" style={{ marginTop: 4 }}>{description}</p>}
          </div>
          <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} autoFocus />
        </div>
        <div className="ds-modal__body">{children}</div>
        {footer && <div className="ds-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", destructive, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
