import type { ReactNode } from "react";
import { Bell, LogOut, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  active: boolean;
  icon: LucideIcon;
};

type AppShellProps = {
  active: string;
  nav: NavItem[];
  children: ReactNode;
  userMode?: boolean;
  onNavigate: (path: string) => void;
};

function NavButton({ item, onNavigate }: { item: NavItem; onNavigate: (path: string) => void }) {
  const Icon = item.icon;
  return (
    <button className={item.active ? "active" : ""} onClick={() => onNavigate(item.path)}>
      <Icon size={18} strokeWidth={2.1} />
      <span>{item.label}</span>
    </button>
  );
}

export function AppShell({ active, nav, children, userMode = false, onNavigate }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="sidebar">
        <div className="command-brand">
          <button className="brand" onClick={() => onNavigate(userMode ? "/user/index.html" : "/applications/applications.html")}>
            <span className="brand-mark"><img src="/assets/brand-mark.png" alt="" /></span>
            <span>
              <strong>ФасадКонтроль</strong>
              <small>контроль фасадов и кровель</small>
            </span>
          </button>
        </div>
        <nav className="tabs" aria-label="Основная навигация">
          {nav.map((item) => <NavButton key={item.path} item={item} onNavigate={onNavigate} />)}
        </nav>
        <div className="right-controls nav-controls">
          {!userMode && (
            <button className={active === "admin-notifications" ? "icon-btn active" : "icon-btn"} title="Уведомления" onClick={() => onNavigate("/notifications/notifications.html")}>
              <Bell size={19} />
            </button>
          )}
          <button className="link-btn" onClick={() => onNavigate(userMode ? "/user/profile.html" : "/profile/profile.html")}>
            <UserCircle size={18} />
            <span>{userMode ? "Профиль" : "Личный кабинет"}</span>
          </button>
          <button className="link-btn muted" onClick={() => onNavigate("/logout.html")}>
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </div>
      </header>
      <div className="workspace">{children}</div>
    </div>
  );
}
