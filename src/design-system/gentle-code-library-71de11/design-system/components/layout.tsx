import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  sidebar: ReactNode;
  topbar?: ReactNode;
}

/** Sidebar + topbar + scrolling content frame. */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell({ sidebar, topbar, children, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn("ds-shell", className)} {...props}>
      {sidebar}
      <div className="ds-shell__main">
        {topbar}
        <main>{children}</main>
      </div>
    </div>
  );
});

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar({ brand, children, className, ...props }, ref) {
  return (
    <nav ref={ref} aria-label="Main" className={cn("ds-sidebar", className)} {...props}>
      {brand && <div className="ds-sidebar__brand">{brand}</div>}
      {children}
    </nav>
  );
});

export interface SidebarSectionProps extends HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

export const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(function SidebarSection({ heading, children, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn("ds-sidebar__section", className)} {...props}>
      {heading && <div className="ds-sidebar__heading">{heading}</div>}
      {children}
    </div>
  );
});

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: ReactNode;
  active?: boolean;
}

/** Sidebar link. Active item uses brand-soft background + brand text. */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(function NavItem({ icon, active, children, className, ...props }, ref) {
  return (
    <a ref={ref} aria-current={active ? "page" : undefined} className={cn("ds-nav-item", className)} {...props}>
      {icon}
      <span>{children}</span>
    </a>
  );
});

export const Topbar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Topbar({ className, ...props }, ref) {
  return <header ref={ref} className={cn("ds-topbar", className)} {...props} />;
});

export const PageContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function PageContainer({ className, ...props }, ref) {
  return <div ref={ref} className={cn("ds-page", className)} {...props} />;
});

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader({ title, description, actions, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn("ds-page-header", className)} {...props}>
      <div className="ds-page-header__text">
        <h1 className="ds-h1">{title}</h1>
        {description && <p className="ds-body">{description}</p>}
      </div>
      {actions && <div className="ds-page-header__actions">{actions}</div>}
    </div>
  );
});

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs({ items, value, onChange, className, ...props }, ref) {
  return (
    <div ref={ref} role="tablist" className={cn("ds-tabs", className)} {...props}>
      {items.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={t.value === value} className="ds-tab" onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
});
