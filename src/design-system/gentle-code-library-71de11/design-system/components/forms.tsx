import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type HTMLAttributes,
} from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "../lib/cn";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** id of the control the label points at. */
  htmlFor?: string;
  children: ReactNode;
}

/** Label + control + hint/error wrapper. Wrap every form control in a Field. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, hint, error, htmlFor, className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("ds-field", className)} {...props}>
      {label && <label className="ds-label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="ds-error-text" role="alert">{error}</span> : hint && <span className="ds-hint">{hint}</span>}
    </div>
  );
});

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "md" | "lg";
  invalid?: boolean;
}

/** Text input. 44px default height. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "lg", invalid, className, ...props },
  ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn("ds-input", size === "md" && "ds-input--sm", className)} {...props} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, ...props }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn("ds-textarea", className)} {...props} />;
});

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  placeholder?: string;
  size?: "md" | "lg";
  invalid?: boolean;
}

/** Native select styled to match inputs. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, size = "lg", invalid, className, ...props },
  ref,
) {
  return (
    <div className={cn("ds-select-wrap", className)}>
      <select ref={ref} aria-invalid={invalid || undefined} className={cn("ds-select", size === "md" && "ds-select--sm")} {...props}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown aria-hidden />
    </div>
  );
});

export interface SearchInputProps extends Omit<InputProps, "type"> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, "aria-label": ariaLabel = "Search", ...props },
  ref,
) {
  return (
    <div className={cn("ds-search", className)}>
      <Search aria-hidden />
      <Input ref={ref} type="search" aria-label={ariaLabel} {...props} />
    </div>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, id, ...props }, ref) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label className={cn("ds-check", className)} htmlFor={cid}>
      <input ref={ref} id={cid} type="checkbox" {...props} />
      {label}
    </label>
  );
});

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, className, id, ...props }, ref) {
  const auto = useId();
  const rid = id ?? auto;
  return (
    <label className={cn("ds-check", className)} htmlFor={rid}>
      <input ref={ref} id={rid} type="radio" {...props} />
      {label}
    </label>
  );
});
