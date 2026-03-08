import {
  BellDot,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Home,
  Library,
  Menu,
  PanelRightOpen,
  Settings,
  User,
  Waves,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthMeQuery } from "../../features/auth/queries/use-auth-queries";
import { useSessionStore } from "../../features/sessions/store/session-store";
import { useUiStore } from "../../features/ui/store/ui-store";
import { useI18n } from "../../shared/i18n/i18n-provider";
import { displayName, formatHours } from "../../shared/utils/ui-format";
import { FriendsSidebar, FriendsSidebarContent } from "./components/FriendsSidebar";
import { NotificationPopover } from "./components/NotificationPopover";

const navConfig: Array<{
  to: string;
  labelKey: string;
  icon: typeof Home;
  end?: boolean;
}> = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/library", labelKey: "nav.library", icon: Library },
  { to: "/activity", labelKey: "nav.activity", icon: BellDot },
  { to: "/profile", labelKey: "nav.profile", icon: User },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

function SidebarContent() {
  const { t } = useI18n();
  const { data: user } = useAuthMeQuery();
  const collapsed = useUiStore((state) => state.leftSidebarCollapsed);
  const toggleLeftSidebar = useUiStore((state) => state.toggleLeftSidebar);
  const closeMobileDrawer = useUiStore((state) => state.closeMobileDrawer);

  return (
    <aside className={`flex h-full flex-col gap-6 px-4 py-5 ${collapsed ? "items-center" : ""}`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-3`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="atlas-logo-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Waves size={18} />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-2xl font-black tracking-[0.08em] text-white">ATLAS</p>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">{t("shell.desktopLauncher")}</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="btn btn-circle btn-ghost hidden border border-white/10 bg-white/5 lg:flex"
          onClick={toggleLeftSidebar}
          aria-label={collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="grid gap-1">
        {navConfig.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={Boolean(item.end)}
            onClick={closeMobileDrawer}
            className={({ isActive }) =>
              `atlas-nav-item ${isActive ? "is-active" : ""} ${collapsed ? "justify-center px-0" : ""}`
            }
          >
            <item.icon size={18} />
            {!collapsed ? <span>{t(item.labelKey)}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.75rem] border border-white/10 bg-black/10 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="avatar atlas-avatar-ring">
            <div className="w-12 rounded-2xl bg-base-300">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName(user)} /> : null}
            </div>
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{displayName(user ?? {})}</p>
              <p className="truncate text-sm text-white/55">{user?.email ?? "atlas@realm"}</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function AppShell() {
  const { t } = useI18n();
  const mobileDrawerOpen = useUiStore((state) => state.mobileDrawerOpen);
  const toggleMobileDrawer = useUiStore((state) => state.toggleMobileDrawer);
  const closeMobileDrawer = useUiStore((state) => state.closeMobileDrawer);
  const rightSidebarOpen = useUiStore((state) => state.rightSidebarOpen);
  const toggleRightSidebar = useUiStore((state) => state.toggleRightSidebar);
  const localSessions = useSessionStore((state) => state.localSessions);

  const activeSession = localSessions.find((session) => session.is_active);

  return (
    <div className="drawer lg:drawer-open bg-transparent">
      <input
        id="atlas-shell-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={mobileDrawerOpen}
        onChange={toggleMobileDrawer}
      />

      <div className="drawer-content min-h-screen px-3 py-3 lg:px-4 lg:py-4">
        <div className="atlas-shell-grid min-h-[calc(100vh-1.5rem)] gap-4 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <aside className="atlas-glass-panel hidden w-[17rem] lg:flex lg:flex-col">
            <SidebarContent />
          </aside>

          <div className="min-w-0">
            <header className="atlas-glass-panel mb-4 flex h-20 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2 lg:hidden">
                <label htmlFor="atlas-shell-drawer" className="btn btn-circle btn-ghost border border-white/10 bg-white/5">
                  <Menu size={18} />
                </label>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <button
                    type="button"
                    className="btn btn-circle btn-ghost border border-white/10 bg-white/5"
                    onClick={toggleRightSidebar}
                    aria-label={t("shell.toggleFriends")}
                  >
                    <PanelRightOpen size={18} />
                  </button>
                </div>
                <NotificationPopover />
              </div>
            </header>

            <main className="min-w-0 pb-24">
              <Outlet />
            </main>
          </div>

          <FriendsSidebar />
        </div>

        {rightSidebarOpen ? (
          <div className="xl:hidden">
            <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" onClick={toggleRightSidebar} />
            <aside className="atlas-glass-panel fixed inset-y-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden">
              <FriendsSidebarContent compact onClose={toggleRightSidebar} />
            </aside>
          </div>
        ) : null}

        {activeSession ? (
          <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2">
            <div className="rounded-full border border-primary/25 bg-primary/15 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-content">
                  <Gamepad2 size={16} />
                </span>
                <div>
                  <p className="font-semibold">{activeSession.game_name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">{formatHours(activeSession.duration_seconds)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="drawer-side z-50 lg:hidden">
        <label htmlFor="atlas-shell-drawer" className="drawer-overlay" onClick={closeMobileDrawer} />
        <div className="atlas-glass-panel flex h-full w-[17rem] flex-col">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}
