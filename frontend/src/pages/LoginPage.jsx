import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorBox } from "../components/ui";
import { homeFor } from "../components/ProtectedRoute";
 
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
 
  if (user) return <Navigate to={homeFor(user)} replace />;
 
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const me = await login(form.email, form.password);
      // Admins always start on the Admin Dashboard; students go back
      // to the page they tried to open, or their Dashboard.
      const target = me.role === "Admin" ? "/admin" : location.state?.from?.pathname || "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
 
  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand big">StudyFlow</div>
        <p className="muted">Log in to your study workspace</p>
        <ErrorBox error={error} />
        <label>
          Email
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button className="btn primary" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="muted small">
          No account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
 
 