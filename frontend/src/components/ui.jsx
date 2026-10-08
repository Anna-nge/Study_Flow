// Small shared UI pieces used across pages.
import { useEffect, useState } from "react";
import { coursesApi } from "../api";

export function PageHeader({ title, children }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <div className="actions">{children}</div>
    </header>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="error">{error}</div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CourseBadge({ course }) {
  if (!course) return null;
  return (
    <span className="badge" style={{ borderColor: course.color, color: course.color }}>
      {course.courseCode || course.courseName}
    </span>
  );
}

// Loads the user's courses once; used by notes, tasks and the timer.
export function useCourses() {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    coursesApi.list().then((d) => setCourses(d.courses)).catch(() => {});
  }, []);
  return courses;
}

export function CourseSelect({ courses, value, onChange, allowNone = true, noneLabel = "No course", ...rest }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} {...rest}>
      {allowNone && <option value="">{noneLabel}</option>}
      {courses.map((c) => (
        <option key={c._id} value={c._id}>
          {c.courseCode ? `${c.courseCode} · ` : ""}{c.courseName}
        </option>
      ))}
    </select>
  );
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
