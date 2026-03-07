import {
  Bell,
  Gamepad2,
  Home,
  Library,
  Menu,
  Search,
  Timer,
  User,
  Waves,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthMeQuery } from "../../features/auth/queries/use-auth-queries";
import { useSessionStore } from "../../features/sessions/store/session-store";
import { useUiStore } from "../../features/ui/store/ui-store";

const navItems = [
  { to: "/", label: "Launcher", icon: Home, end: true },
  { to: "/library", label: "Library", icon: Library },
  { to: "/sessions", label: "Sessions", icon: Timer },
  { to: "/profile", label: "Profile", icon: User },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export function AppShell() {
  const { data: user } = useAuthMeQuery();
  const localSessions = useSessionStore((state) => state.localSessions);
  const mobileDrawerOpen = useUiStore((state) => state.mobileDrawerOpen);
  const toggleMobileDrawer = useUiStore((state) => state.toggleMobileDrawer);
  const closeMobileDrawer = useUiStore((state) => state.closeMobileDrawer);

  const activeSession = localSessions.find((session) => session.is_active);

  return (
    <div className="drawer lg:drawer-open bg-base-100">
      <input
        id="atlas-shell-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={mobileDrawerOpen}
        onChange={toggleMobileDrawer}
      />

      <div className="drawer-content min-h-screen">
        <header className="navbar border-b border-base-300 bg-base-100/90 backdrop-blur sticky top-0 z-20">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="atlas-shell-drawer"
              className="btn btn-square btn-ghost"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </label>
          </div>
          <div className="flex-1 px-2 gap-2">
            <div className="input input-bordered input-sm md:input-md flex items-center gap-2 w-full max-w-xl">
              <Search size={16} className="opacity-70" />
              <input type="text" className="grow" placeholder="Search games, friends, store" readOnly />
            </div>
          </div>
          <div className="flex-none gap-2">
            <button type="button" className="btn btn-ghost btn-circle" disabled aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="avatar">
              <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={
                    user?.avatarUrl ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                  }
                  alt={user?.username || "avatar"}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 pb-24">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            <section className="min-w-0">
              <Outlet />
            </section>

            <aside className="hidden xl:grid gap-4 sticky top-24">
              <article className="card bg-base-200 border border-base-300 shadow-xl">
                <div className="card-body p-4">
                  <h3 className="card-title text-base">Friends Activity</h3>
                  <ul className="menu bg-base-200 p-0 gap-2">
                    {[
                      ["Alex_Storm", "Playing Valorant"],
                      ["SarahQuest", "Playing Elden Ring"],
                      ["TurboDev", "Playing Starfield"],
                    ].map(([name, status]) => (
                      <li key={name}>
                        <div className="justify-between rounded-lg bg-base-100 border border-base-300">
                          <span className="font-medium">{name}</span>
                          <span className="text-xs opacity-70">{status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="card bg-base-200 border border-base-300 shadow-xl">
                <div className="card-body p-4">
                  <h4 className="font-semibold uppercase text-primary text-xs tracking-wide">Party Suggestion</h4>
                  <p className="text-sm opacity-75">Join Alex_Storm in Valorant?</p>
                  <button type="button" className="btn btn-primary btn-sm" disabled>
                    Join Party
                  </button>
                </div>
              </article>
            </aside>
          </div>
        </main>

        {activeSession ? (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-30">
            <div className="badge badge-lg badge-primary gap-2 py-4 px-4 text-primary-content shadow-xl">
              <Gamepad2 size={16} />
              <span>{activeSession.game_name}</span>
              <strong>{formatDuration(activeSession.duration_seconds)}</strong>
            </div>
          </div>
        ) : null}
      </div>

      <div className="drawer-side z-30">
        <label htmlFor="atlas-shell-drawer" className="drawer-overlay" onClick={closeMobileDrawer} />
        <aside className="w-72 min-h-full bg-base-200 border-r border-base-300 p-4 grid content-start gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-content grid place-items-center">
              <Waves size={18} />
            </div>
            <div>
              <p className="font-black text-2xl tracking-wide">ATLAS</p>
              <p className="text-xs opacity-70">Desktop Launcher</p>
            </div>
          </div>

          <ul className="menu bg-base-200 rounded-box gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={closeMobileDrawer}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
