import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ControlSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Destructive is only for Delete / Remove / Discard. */
  variant?: ButtonVariant;
  size?: ControlSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/** The primary action control. One primary button per view region. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, leadingIcon, trailingIcon, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn("ds-btn", `ds-btn--${variant}`, size !== "md" && `ds-btn--${size}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required accessible name (also used as tooltip). */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ControlSize;
}

/** Square icon-only button. Always has an accessible label + tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "ghost", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn("ds-btn", "ds-btn--icon", `ds-btn--${variant}`, size !== "md" && `ds-btn--${size}`, className)}
      {...props}
    >
      {icon}
    </button>
  );
});

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ControlSize;
  label?: string;
}

/** Only for button actions and small operations — use Skeleton for content loading. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", className, ...props },
  ref,
) {
  return <span ref={ref} role="status" aria-label={label} className={cn("ds-spinner", `ds-spinner--${size}`, className)} {...props} />;
});
