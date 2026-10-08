import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: "▦" },
  { to: "/courses", label: "Courses", icon: "▤" },
  { to: "/notes", label: "Notes", icon: "✎" },
  { to: "/tasks", label: "Tasks", icon: "☑" },
  { to: "/focus", label: "Focus timer", icon: "◷" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">StudyFlow</div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              <span className="icon">{l.icon}</span> {l.label}
            </NavLink>
          ))}
          {user.role === "Admin" && (
            <NavLink to="/admin">
              <span className="icon">⚙</span> Admin
            </NavLink>
          )}
        </nav>
        <div className="sidebar-foot">
          <NavLink to="/profile" className="profile-link">
            {user.name}
            <small>{user.role}</small>
          </NavLink>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
