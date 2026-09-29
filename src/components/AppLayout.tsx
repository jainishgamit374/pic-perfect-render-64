import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LayoutDashboard, ClipboardList, Plus, LogOut, LayoutTemplate } from "lucide-react";
import {
  AppShell,
  Avatar,
  IconButton,
  NavItem,
  Sidebar,
  SidebarSection,
  Topbar,
} from "@/design-system/gentle-code-library-71de11";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { to: "/inspections", label: "Inspections", icon: <ClipboardList /> },
  { to: "/inspections/new", label: "New inspection", icon: <Plus /> },
  { to: "/templates", label: "Templates", icon: <LayoutTemplate /> },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <Sidebar
      brand={
        <span className="app-row app-brand">
          <span className="app-brand-mark"><Building2 aria-hidden /></span>
          <strong>Inspect</strong>
        </span>
      }
    >
      <SidebarSection heading="Workspace">
        {NAV.map((item) => (
          <NavItem
            key={item.to}
            href={item.to}
            icon={item.icon}
            active={pathname === item.to}
            onClick={(event) => {
              event.preventDefault();
              navigate({ to: item.to });
            }}
          >
            {item.label}
          </NavItem>
        ))}
      </SidebarSection>
      <div className="app-sidebar-account"><Avatar name={user?.email ?? "Inspector"} /><span className="ds-body-sm">{user?.email ?? "Inspector"}</span></div>
    </Sidebar>
  );

  const topbar = (
    <Topbar>
      <div className="app-row app-row--between app-fill">
        <span className="ds-body-sm">INSPECT / WORKSPACE</span>
        <span className="app-row">
          <Avatar name={user?.email ?? "Inspector"} />
          <IconButton label="Sign out" icon={<LogOut />} variant="ghost" onClick={signOut} />
        </span>
      </div>
    </Topbar>
  );

  return (
    <AppShell sidebar={sidebar} topbar={topbar}>
      {children}
    </AppShell>
  );
}
