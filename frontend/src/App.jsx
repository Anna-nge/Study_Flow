import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import NotesPage from "./pages/NotesPage";
import TasksPage from "./pages/TasksPage";
import PomodoroPage from "./pages/PomodoroPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
 
// Student pages: only role "Student". Admin page: only role "Admin".
// (The backend checks the role again on every request.)
const student = (page) => <ProtectedRoute role="Student">{page}</ProtectedRoute>;
const admin = (page) => <ProtectedRoute role="Admin">{page}</ProtectedRoute>;
 
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
 
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={student(<DashboardPage />)} />
        <Route path="/courses" element={student(<CoursesPage />)} />
        <Route path="/notes" element={student(<NotesPage />)} />
        <Route path="/tasks" element={student(<TasksPage />)} />
        <Route path="/focus" element={student(<PomodoroPage />)} />
        <Route path="/admin" element={admin(<AdminPage />)} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
 
 