import { forwardRef, useRef, useState, type HTMLAttributes, type ReactNode, type DragEvent, type KeyboardEvent } from "react";
import { FileImage, UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { Badge, severityColor, type Severity } from "./data";
import { IconButton } from "./actions";

export type ImageKind = "thermal" | "visual";

export interface ImageCardProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  filename: string;
  kind?: ImageKind;
  severity?: Severity;
  /** Metadata items shown in the footer. */
  meta?: ReactNode[];
  /** Slot for a menu / IconButton in the header. */
  actions?: ReactNode;
  selected?: boolean;
}

/** Standard inspection image card: [type badge] filename ⋮ / image / metadata. */
export const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(function ImageCard(
  { src, alt, filename, kind, severity, meta, actions, selected, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("ds-card", "ds-image-card", selected && "ds-card--selected", className)} {...props}>
      <div className="ds-image-card__head">
        {kind && <Badge tone={kind === "thermal" ? "danger-orange" : "brand"}>{kind === "thermal" ? "Thermal IR" : "Visual HD"}</Badge>}
        <span className="ds-image-card__name" title={filename}>{filename}</span>
        {actions}
      </div>
      <div className="ds-image-card__media">
        <img src={src} alt={alt} loading="lazy" />
        {severity && <span className="ds-image-card__severity" style={{ background: severityColor(severity) }} aria-hidden />}
      </div>
      {meta && meta.length > 0 && <div className="ds-image-card__meta">{meta.map((m, i) => <span key={i}>{m}</span>)}</div>}
    </div>
  );
});

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  value: number;
  /** Right-aligned detail text, defaults to the percentage. */
  detail?: ReactNode;
  tone?: "brand" | "success";
  size?: "sm" | "md";
}

/** Labelled progress. Keep upload and analysis as two separate bars. */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  { label, value, detail, tone = "brand", size = "md", className, ...props },
  ref,
) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div ref={ref} className={cn("ds-progress", tone === "success" && "ds-progress--success", size === "sm" && "ds-progress--sm", className)} {...props}>
      {(label || detail !== undefined) && (
        <div className="ds-progress__row">
          {label && <span className="ds-progress__label">{label}</span>}
          <span className="ds-progress__value">{detail ?? `${Math.round(pct)}%`}</span>
        </div>
      )}
      <div className="ds-progress__track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="ds-progress__bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
});

export interface DropZoneProps extends Omit<HTMLAttributes<HTMLDivElement>, "onDrop"> {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  hint?: string;
}

export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(function DropZone(
  { onFiles, accept = "image/*", multiple = true, title = "Drop images here or click to browse", hint = "JPG, PNG, TIFF · up to 500 images", className, ...props },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setActive(false);
    onFiles(Array.from(e.dataTransfer.files));
  };
  const onKey = (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click());
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={cn("ds-dropzone", active && "ds-dropzone--active", className)}
      onClick={() => input.current?.click()}
      onKeyDown={onKey}
      onDragOver={(e) => (e.preventDefault(), setActive(true))}
      onDragLeave={() => setActive(false)}
      onDrop={onDrop}
      {...props}
    >
      <span className="ds-dropzone__icon" aria-hidden><UploadCloud /></span>
      <span style={{ fontWeight: 600 }}>{title}</span>
      <span className="ds-caption">{hint}</span>
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => onFiles(Array.from(e.target.files ?? []))} />
    </div>
  );
});

export interface UploadItemProps extends HTMLAttributes<HTMLDivElement> {
  filename: string;
  sizeLabel?: string;
  progress: number;
  state: "uploading" | "done" | "error";
  thumbnail?: string;
  onRemove?: () => void;
}

/** One row in the upload queue with its own progress. */
export const UploadItem = forwardRef<HTMLDivElement, UploadItemProps>(function UploadItem(
  { filename, sizeLabel, progress, state, thumbnail, onRemove, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("ds-upload-item", className)} {...props}>
      <span className="ds-upload-item__thumb">{thumbnail ? <img src={thumbnail} alt="" width={40} height={40} /> : <FileImage aria-hidden />}</span>
      <div className="ds-upload-item__main">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span className="ds-upload-item__name">{filename}</span>
          <span className="ds-caption">{state === "error" ? "Failed" : state === "done" ? sizeLabel : `${Math.round(progress)}%`}</span>
        </div>
        {state === "uploading" && <ProgressBar value={progress} size="sm" />}
      </div>
      {state === "done" && <CheckCircle2 aria-label="Uploaded" style={{ color: "var(--ds-color-success)", width: 18 }} />}
      {state === "error" && <AlertCircle aria-label="Failed" style={{ color: "var(--ds-color-error)", width: 18 }} />}
      {onRemove && <IconButton label={`Remove ${filename}`} size="sm" icon={<X />} onClick={onRemove} />}
    </div>
  );
});
