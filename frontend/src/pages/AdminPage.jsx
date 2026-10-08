import { useCallback, useEffect, useState } from "react";
import { usersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox, Modal, PageHeader, fmtDate, fmtMinutes } from "../components/ui";

const blank = { name: "", email: "", password: "", role: "Student" };

export default function AdminPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(null);

  const load = useCallback(() => {
    usersApi.list(q).then((d) => setUsers(d.users)).catch((e) => setError(e.message));
    usersApi.stats().then(setStats).catch(() => {});
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce the search box
    return () => clearTimeout(t);
  }, [load]);

  const changeRole = async (u, role) => {
    try {
      await usersApi.update(u._id, { role });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} and all of their data?`)) return;
    try {
      await usersApi.remove(u._id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await usersApi.create(creating);
      setCreating(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Admin">
        <input placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn primary" onClick={() => setCreating(blank)}>New user</button>
      </PageHeader>
      <ErrorBox error={error} />

      {stats && (
        <div className="stats">
          <Stat label="Users" value={stats.users} sub={`${stats.students} students · ${stats.admins} admins`} />
          <Stat label="Courses" value={stats.courses} />
          <Stat label="Notes" value={stats.notes} />
          <Stat label="Tasks" value={stats.tasks} />
          <Stat label="Hours studied" value={(stats.studyMinutes / 60).toFixed(1)} />
        </div>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Courses</th><th>Tasks</th><th>Studied</th><th>Joined</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} disabled={u._id === me._id} onChange={(e) => changeRole(u, e.target.value)}>
                    <option>Student</option>
                    <option>Admin</option>
                  </select>
                </td>
                <td>{u.courseCount}</td>
                <td>{u.taskCount}</td>
                <td>{fmtMinutes(u.studyMinutes)}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td>
                  {u._id !== me._id && <button className="btn ghost danger-text" onClick={() => remove(u)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
