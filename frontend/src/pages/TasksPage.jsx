import { useEffect, useState } from "react";
import { tasksApi } from "../api";
import { CourseBadge, CourseSelect, Empty, ErrorBox, Modal, PageHeader, fmtDate, useCourses } from "../components/ui";

const PRIORITIES = ["Low", "Medium", "High"];

// yyyy-mm-dd for <input type="date"> in the user's local time
const toInputDate = (d) => {
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function TasksPage() {
  const courses = useCourses();
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: "", priority: "", courseId: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = () => tasksApi.list(filters).then((d) => setTasks(d.tasks)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const toggle = async (t) => {
    try {
      await tasksApi.update(t._id, { status: t.status === "Completed" ? "InProgress" : "Completed" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (t) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    try {
      await tasksApi.remove(t._id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <PageHeader title="Tasks & assignments">
        <button
          className="btn primary"
          onClick={() => setEditing({ title: "", description: "", dueDate: toInputDate(new Date()), priority: "Medium", courseId: "" })}
        >
          New task
        </button>
      </PageHeader>
      <ErrorBox error={error} />

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="InProgress">In progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <CourseSelect courses={courses} value={filters.courseId} noneLabel="All courses" onChange={(courseId) => setFilters({ ...filters, courseId })} />
      </div>

      {tasks.length === 0 ? (
        <Empty>No tasks here. Add an assignment or to-do.</Empty>
      ) : (
        <ul className="task-list">
          {tasks.map((t) => {
            const done = t.status === "Completed";
            const overdue = !done && new Date(t.dueDate) < today;
            return (
              <li key={t._id} className={`card task ${done ? "done" : ""}`}>
                <input type="checkbox" checked={done} onChange={() => toggle(t)} aria-label="Toggle complete" />
                <div className="task-main">
                  <strong>{t.title}</strong>
                  {t.description && <p className="muted small">{t.description}</p>}
                  <div className="row small">
                    <span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    <CourseBadge course={t.courseId} />
                    <span className={overdue ? "danger-text" : "muted"}>
                      {overdue ? "Overdue · " : "Due "}{fmtDate(t.dueDate)}
                    </span>
                    <span className="muted">{done ? "Completed" : "In progress"}</span>
                  </div>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => setEditing({ ...t, courseId: t.courseId?._id || "", dueDate: toInputDate(t.dueDate) })}
                >
                  Edit
                </button>
                <button className="btn ghost danger-text" onClick={() => remove(t)}>Delete</button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <TaskForm
          initial={editing}
          courses={courses}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function TaskForm({ initial, courses, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      title: form.title,
      description: form.description,
      // End of the chosen day in local time, so "due today" isn't overdue at 00:01.
      dueDate: new Date(`${form.dueDate}T23:59:00`).toISOString(),
      priority: form.priority,
      courseId: form.courseId || null,
    };
    try {
      if (initial._id) await tasksApi.update(initial._id, body);
      else await tasksApi.create(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={initial._id ? "Edit task" : "New task"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <ErrorBox error={error} />
        <label>Title<input required value={form.title} onChange={set("title")} /></label>
        <label>Details<textarea rows={3} value={form.description} onChange={set("description")} /></label>
        <div className="row">
          <label>Due date<input type="date" required value={form.dueDate} onChange={set("dueDate")} /></label>
          <label>Priority
            <select value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <label>Course
          <CourseSelect courses={courses} value={form.courseId} onChange={(courseId) => setForm({ ...form, courseId })} />
        </label>
        <button className="btn primary">Save task</button>
      </form>
    </Modal>
  );
}
