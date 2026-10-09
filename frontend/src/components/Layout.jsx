import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
 
// Students see the study pages; Admins see only the Admin Dashboard.
const studentLinks = [
  { to: "/", label: "Dashboard", icon: "▦" },
  { to: "/courses", label: "Courses", icon: "▤" },
  { to: "/notes", label: "Notes", icon: "✎" },
  { to: "/tasks", label: "Tasks", icon: "☑" },
  { to: "/focus", label: "Focus timer", icon: "◷" },
];
 
const adminLinks = [{ to: "/admin", label: "Admin Dashboard", icon: "⚙" }];
 
export default function Layout() {
  const { user, logout } = useAuth();
  const links = user.role === "Admin" ? adminLinks : studentLinks;
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