import {
  Bell,
  Gamepad2,
  Home,
  Library,
  Search,
  Settings,
  Timer,
  User,
  Waves,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
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

export default function ShellLayout() {
  const { user } = useAuth();
  const { localSessions } = useAppData();
  const activeSession = localSessions.find((session) => session.is_active);

  return (
    <div className="shell-root">
      <aside className="shell-sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Waves size={18} />
          </div>
          <div className="brand-text">NOVA</div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="settings-link" disabled>
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </aside>

      <main className="shell-main">
        <header className="topbar">
          <div className="search-pill">
            <Search size={18} />
            <span>Search games, friends, or store...</span>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-btn" disabled>
              <Bell size={18} />
            </button>
            <div className="avatar-chip">
              <img
                src={
                  user?.avatarUrl ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                }
                alt={user?.username || "avatar"}
              />
            </div>
          </div>
        </header>

        <section className="shell-content">
          <Outlet />
        </section>
      </main>

      <aside className="shell-right">
        <div className="friends-panel">
          <div className="panel-head">
            <h3>Friends Activity</h3>
            <span>12 Online</span>
          </div>
          <div className="friend-list">
            {[
              ["Alex_Storm", "Playing Valorant", "In a Competitive Match"],
              ["SarahQuest", "Playing Elden Ring", "Exploring Limgrave"],
              ["TurboDev", "Playing Starfield", "Planet: Jemison"],
            ].map(([name, status, subtitle]) => (
              <article className="friend-item" key={name}>
                <div className="friend-avatar" />
                <div>
                  <strong>{name}</strong>
                  <p>{status}</p>
                  <small>{subtitle}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="party-card">
          <h4>Party Suggestion</h4>
          <p>Join Alex_Storm in Valorant?</p>
          <button type="button" disabled>
            Join Party
          </button>
        </div>
      </aside>

      {activeSession ? (
        <div className="active-session-pill">
          <Gamepad2 size={18} />
          <span>{activeSession.game_name}</span>
          <strong>{formatDuration(activeSession.duration_seconds)}</strong>
        </div>
      ) : null}
    </div>
  );
}
