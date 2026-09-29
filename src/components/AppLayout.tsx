import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LayoutDashboard, ClipboardList, Upload, LogOut } from "lucide-react";
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
  { to: "/inspections/new", label: "New inspection", icon: <Upload /> },
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
        <span className="app-row">
          <Building2 aria-hidden />
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
    </Sidebar>
  );

  const topbar = (
    <Topbar>
      <div className="app-row app-row--between" style={{ width: "100%" }}>
        <span className="ds-body-sm">Property inspection reports</span>
        <span className="app-row">
          <Avatar name={user?.email ?? "Inspector"} />
          <span className="ds-body-sm">{user?.email}</span>
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
