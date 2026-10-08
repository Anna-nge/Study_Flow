import { useState } from "react";
import { authApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox, PageHeader, fmtDate } from "../components/ui";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, currentPassword: "", newPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const body = { name: form.name, email: form.email };
      if (form.newPassword) Object.assign(body, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      const { user: updated } = await authApi.updateMe(body);
      setUser(updated);
      setForm({ ...form, currentPassword: "", newPassword: "" });
      setMessage("Profile saved");
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account and all your courses, notes, tasks and study logs? This cannot be undone.")) return;
    try {
      await authApi.deleteMe();
      logout();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Profile" />
      <form className="card form narrow" onSubmit={save}>
        <p className="muted small">Role: {user.role} · Member since {fmtDate(user.createdAt)}</p>
        <ErrorBox error={error} />
        {message && <div className="success">{message}</div>}
        <label>Name<input required value={form.name} onChange={set("name")} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set("email")} /></label>
        <h3>Change password</h3>
        <label>Current password<input type="password" value={form.currentPassword} onChange={set("currentPassword")} /></label>
        <label>New password<input type="password" minLength={6} value={form.newPassword} onChange={set("newPassword")} /></label>
        <div className="row">
          <button className="btn primary">Save changes</button>
          <button type="button" className="btn danger" onClick={deleteAccount}>Delete account</button>
        </div>
      </form>
    </>
  );
}
