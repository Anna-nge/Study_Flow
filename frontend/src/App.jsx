import { Routes, Route, Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Courses from "./pages/Courses";
import Schedule from "./pages/Schedule";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const { user, logout } = useAuth();
  return (
    <div>
      <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ccc", alignItems: "center" }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/schedule">Schedule</NavLink>
        <span style={{ marginLeft: "auto" }}>{user.name} ({user.role})</span>
        <button onClick={logout}>Log out</button>
      </nav>
      <Outlet />
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  return <h2 style={{ padding: 24 }}>Welcome, {user.name}</h2>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/schedule" element={<Schedule />} />
      </Route>
    </Routes>
  );
}