import { useCallback, useEffect, useState } from "react";
import { usersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox, Modal, PageHeader, fmtDate, fmtMinutes } from "../components/ui";
 
const blank = { name: "", email: "", password: "", role: "Student" };
 
// Admin Dashboard: system overview + user management.
// Admins see account info and counts only, never students' notes or passwords.
export default function AdminPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(null);
  const [viewing, setViewing] = useState(null);
 
  const load = useCallback(() => {
    usersApi.list(q).then((d) => setUsers(d.users)).catch((e) => setError(e.message));
    usersApi.stats().then(setStats).catch(() => {});
  }, [q]);
 
  useEffect(() => {
    const t = setTimeout(load, 250); // debounce the search box
    return () => clearTimeout(t);
  }, [load]);
 
  // Runs one admin action, shows any error, then reloads the table.
  const run = async (action) => {
    setError("");
    try {
      await action();
      load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
 
  const changeRole = (u, role) => run(() => usersApi.update(u._id, { role }));
 
  const toggleActive = (u) => {
    if (u.active && !confirm(`Deactivate ${u.name}? They will not be able to log in.`)) return;
    run(() => usersApi.update(u._id, { active: !u.active }));
  };
 
  const remove = (u) => {
    if (!confirm(`Delete ${u.name} and all of their data? This cannot be undone.`)) return;
    run(() => usersApi.remove(u._id));
  };
 
  const create = async (e) => {
    e.preventDefault();
    if (await run(() => usersApi.create(creating))) setCreating(null);
  };
 
  const shown = roleFilter === "All" ? users : users.filter((u) => u.role === roleFilter);
 
  return (
    <>
      <PageHeader title="Admin Dashboard">
        <input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All roles</option>
          <option value="Student">Students</option>
          <option value="Admin">Admins</option>
        </select>
        <button className="btn primary" onClick={() => setCreating(blank)}>New user</button>
      </PageHeader>
      <ErrorBox error={error} />
 
      {stats && (
        <div className="stats">
          <Stat label="Total users" value={stats.users} sub={stats.deactivated ? `${stats.deactivated} deactivated` : null} />
          <Stat label="Students" value={stats.students} />
          <Stat label="Admins" value={stats.admins} />
          <Stat label="Courses" value={stats.courses} />
          <Stat label="Tasks" value={stats.tasks} />
          <Stat label="Hours studied" value={(stats.studyMinutes / 60).toFixed(1)} />
        </div>
      )}
 
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {shown.map((u) => {
              const isMe = u._id === me._id;
              return (
                <tr key={u._id} className={u.active ? "" : "muted"}>
                  <td>{u.name}{isMe && <span className="muted small"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} disabled={isMe} onChange={(e) => changeRole(u, e.target.value)}>
                      <option>Student</option>
                      <option>Admin</option>
                    </select>
                  </td>
                  <td>{u.active ? "Active" : "Deactivated"}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div className="row">
                      <button className="btn ghost" onClick={() => setViewing(u)}>View</button>
                      {!isMe && (
                        <>
                          <button className="btn ghost" onClick={() => toggleActive(u)}>
                            {u.active ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn ghost danger-text" onClick={() => remove(u)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
 
      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <dl className="details">
            <dt>Email</dt><dd>{viewing.email}</dd>
            <dt>Role</dt><dd>{viewing.role}</dd>
            <dt>Status</dt><dd>{viewing.active ? "Active" : "Deactivated"}</dd>
            <dt>Joined</dt><dd>{fmtDate(viewing.createdAt)}</dd>
            <dt>Courses</dt><dd>{viewing.courseCount}</dd>
            <dt>Tasks</dt><dd>{viewing.taskCount}</dd>
            <dt>Time studied</dt><dd>{fmtMinutes(viewing.studyMinutes)}</dd>
          </dl>
          <p className="muted small">Admins see account info and totals only, not a student's notes.</p>
        </Modal>
      )}
 
      {creating && (
        <Modal title="New user" onClose={() => setCreating(null)}>
          <form className="form" onSubmit={create}>
            <label>Name<input required value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} /></label>
            <label>Email<input type="email" required value={creating.email} onChange={(e) => setCreating({ ...creating, email: e.target.value })} /></label>
            <label>Password<input type="password" required minLength={6} value={creating.password} onChange={(e) => setCreating({ ...creating, password: e.target.value })} /></label>
            <label>Role
              <select value={creating.role} onChange={(e) => setCreating({ ...creating, role: e.target.value })}>
                <option>Student</option><option>Admin</option>
              </select>
            </label>
            <button className="btn primary">Create user</button>
          </form>
        </Modal>
      )}
    </>
  );
}
 
function Stat({ label, value, sub }) {
  return (
    <div className="card stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {sub && <span className="muted small">{sub}</span>}
    </div>
  );
}