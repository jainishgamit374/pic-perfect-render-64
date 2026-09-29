import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./actions";

export type BadgeTone = "neutral" | "brand" | "success" | "info" | "caution" | "warning" | "danger-orange" | "error";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

/** Small pill label. Prefer StatusBadge / SeverityBadge for workflow states. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ tone = "neutral", dot, className, children, ...props }, ref) {
  return (
    <span ref={ref} className={cn("ds-badge", `ds-badge--${tone}`, className)} {...props}>
      {dot && <span className="ds-badge__dot" aria-hidden />}
      {children}
    </span>
  );
});

export type Status = "completed" | "processing" | "review" | "failed" | "draft";
const STATUS: Record<Status, { tone: BadgeTone; label: string }> = {
  completed: { tone: "success", label: "Completed" },
  processing: { tone: "info", label: "Processing" },
  review: { tone: "warning", label: "Needs Review" },
  failed: { tone: "error", label: "Failed" },
  draft: { tone: "neutral", label: "Draft" },
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status;
  /** Override the default label. */
  children?: ReactNode;
}

/** The single status treatment used everywhere (Completed, Processing, Needs Review, Failed, Draft). */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge({ status, children, className, ...props }, ref) {
  const s = STATUS[status];
  return (
    <span ref={ref} className={cn("ds-badge", `ds-badge--${s.tone}`, className)} {...props}>
      {status === "processing" ? <Spinner size="sm" className="ds-badge__spin" label="" aria-hidden /> : <span className="ds-badge__dot" aria-hidden />}
      {children ?? s.label}
    </span>
  );
});

export type Severity = "normal" | "minor" | "moderate" | "defective" | "critical";
const SEVERITY: Record<Severity, { tone: BadgeTone; label: string; color: string }> = {
  normal: { tone: "success", label: "Normal", color: "var(--ds-color-success)" },
  minor: { tone: "caution", label: "Minor", color: "var(--ds-color-caution)" },
  moderate: { tone: "warning", label: "Moderate", color: "var(--ds-color-warning)" },
  defective: { tone: "danger-orange", label: "Defective", color: "var(--ds-color-danger-orange)" },
  critical: { tone: "error", label: "Critical", color: "var(--ds-color-error)" },
};
/** Token color for a severity — use for border indicators only, never whole-card fills. */
export const severityColor = (s: Severity) => SEVERITY[s].color;

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
  children?: ReactNode;
}

export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(function SeverityBadge({ severity, children, className, ...props }, ref) {
  const s = SEVERITY[severity];
  return (
    <span ref={ref} className={cn("ds-badge", `ds-badge--${s.tone}`, className)} {...props}>
      <span className="ds-badge__dot" aria-hidden />
      {children ?? s.label}
    </span>
  );
});

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted";
  padding?: "none" | "default";
  interactive?: boolean;
  selected?: boolean;
}

/** Universal surface: white, 1px border, 12px radius, no heavy shadow. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", padding = "default", interactive, selected, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("ds-card", variant === "muted" && "ds-card--muted", padding === "default" && "ds-card--padded", interactive && "ds-card--interactive", selected && "ds-card--selected", className)}
      {...props}
    />
  );
});

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(function StatCard({ label, value, icon, trend, className, ...props }, ref) {
  return (
    <Card ref={ref} className={cn("ds-stat", className)} {...props}>
      <div className="ds-stat__top">
        <span>{label}</span>
        {icon && <span className="ds-stat__icon" aria-hidden>{icon}</span>}
      </div>
      <div className="ds-stat__value">{value}</div>
      {trend && <div className="ds-stat__trend">{trend}</div>}
    </Card>
  );
});

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  caption?: string;
}

/** Report / inspection table. 52px rows, no vertical borders. Wrap in a Card with padding="none". */
export function DataTable<T>({ columns, rows, getRowKey, onRowClick, className, caption }: DataTableProps<T>) {
  return (
    <div className={cn("ds-table-wrap", className)}>
      <table className="ds-table">
        {caption && <caption style={{ position: "absolute", left: -9999 }}>{caption}</caption>}
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={getRowKey(r)} className={onRowClick ? "ds-table__row--clickable" : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => <td key={c.key} style={{ textAlign: c.align }}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar({ name, src, size = "md", className, ...props }, ref) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span ref={ref} className={cn("ds-avatar", `ds-avatar--${size}`, className)} aria-label={name} role="img" {...props}>
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
});
