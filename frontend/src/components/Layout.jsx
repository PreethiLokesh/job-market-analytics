import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Icon from "./Icon.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/jobs", label: "Browse jobs", icon: "briefcase" },
  { to: "/recommend", label: "Find my jobs", icon: "sparkles" },
  { to: "/applications", label: "Applications", icon: "file" },
  { to: "/profile", label: "Profile", icon: "user" },
];
const TITLES = { "/": "Dashboard", "/jobs": "Browse jobs", "/recommend": "Find my jobs", "/applications": "Applications", "/profile": "Profile", "/admin": "Admin" };

export const initials = (name = "") => name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Brand() {
  return <div className="brand"><span className="logo"><Icon name="trend" size={16} /></span><span>JobMarket</span></div>;
}

/** Sidebar + topbar for logged-in users. Auth pages render without the shell. */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const h = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (!user) return <>{children}</>;
  const items = user.role === "ADMIN" ? [...NAV, { to: "/admin", label: "Admin", icon: "shield" }] : NAV;

  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={"sidebar" + (open ? " open" : "")} aria-label="Primary">
        <Brand />
        <div className="nav-label">Workspace</div>
        <nav>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className="nav-link"><Icon name={i.icon} />{i.label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar">{initials(user.name)}</span>
            <div className="grow"><div className="u-name">{user.name}</div><div className="u-mail">{user.email}</div></div>
            <button className="btn icon ghost" title="Log out" aria-label="Log out" onClick={() => { logout(); nav("/login"); }}><Icon name="logout" /></button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="btn icon ghost menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}><Icon name="menu" /></button>
          <nav className="crumbs" aria-label="Breadcrumb"><span>JobMarket</span><span className="sep">/</span><b>{TITLES[pathname] || ""}</b></nav>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
