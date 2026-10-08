import { useEffect, useState } from "react";
import { coursesApi } from "../api";
import { Empty, ErrorBox, Modal, PageHeader } from "../components/ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6"];
const blank = { courseName: "", courseCode: "", instructor: "", color: COLORS[0], schedule: [] };

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [editing, setEditing] = useState(null); // course being created/edited
  const [view, setView] = useState("list");
  const [error, setError] = useState("");

  const load = () => coursesApi.list().then((d) => setCourses(d.courses)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const remove = async (c) => {
    if (!confirm(`Delete ${c.courseName}? Its notes will be deleted too.`)) return;
    try {
      await coursesApi.remove(c._id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Courses & schedule">
        <div className="segmented">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Courses</button>
          <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Weekly timetable</button>
        </div>
        <button className="btn primary" onClick={() => setEditing(blank)}>Add course</button>
      </PageHeader>
      <ErrorBox error={error} />

      {courses.length === 0 ? (
        <Empty>No courses yet. Add your first course to start planning.</Empty>
      ) : view === "list" ? (
        <div className="grid">
          {courses.map((c) => (
            <div key={c._id} className="card course-card" style={{ borderTopColor: c.color }}>
              <div className="muted small">{c.courseCode}</div>
              <h3>{c.courseName}</h3>
              {c.instructor && <p className="muted">{c.instructor}</p>}
              <ul className="slots">
                {c.schedule.map((s, i) => (
                  <li key={i}>
                    <strong>{s.day}</strong> {s.startTime}–{s.endTime} {s.room && <span className="muted">· {s.room}</span>}
                  </li>
                ))}
              </ul>
              <div className="row">
                <button className="btn ghost" onClick={() => setEditing(c)}>Edit</button>
                <button className="btn ghost danger-text" onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <WeeklyTimetable courses={courses} />
      )}

      {editing && (
        <CourseForm
          initial={editing}
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

function CourseForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({ ...initial, schedule: initial.schedule.map((s) => ({ ...s })) });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const setSlot = (i, k, v) => {
    const schedule = form.schedule.map((s, j) => (j === i ? { ...s, [k]: v } : s));
    setForm({ ...form, schedule });
  };
  const addSlot = () =>
    setForm({ ...form, schedule: [...form.schedule, { day: "Mon", startTime: "09:00", endTime: "10:30", room: "" }] });
  const removeSlot = (i) => setForm({ ...form, schedule: form.schedule.filter((_, j) => j !== i) });

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      courseName: form.courseName,
      courseCode: form.courseCode,
      instructor: form.instructor,
      color: form.color,
      schedule: form.schedule,
    };
    try {
      if (initial._id) await coursesApi.update(initial._id, body);
      else await coursesApi.create(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={initial._id ? "Edit course" : "Add course"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <ErrorBox error={error} />
        <label>Course name<input required value={form.courseName} onChange={set("courseName")} /></label>
        <div className="row">
          <label>Code<input value={form.courseCode} onChange={set("courseCode")} placeholder="CS101" /></label>
          <label>Instructor<input value={form.instructor} onChange={set("instructor")} /></label>
        </div>
        <div className="colors">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`swatch ${form.color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => setForm({ ...form, color: c })}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        <h3>Class times</h3>
        {form.schedule.map((s, i) => (
          <div className="row slot-row" key={i}>
            <select value={s.day} onChange={(e) => setSlot(i, "day", e.target.value)}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input type="time" required value={s.startTime} onChange={(e) => setSlot(i, "startTime", e.target.value)} />
            <input type="time" required value={s.endTime} onChange={(e) => setSlot(i, "endTime", e.target.value)} />
            <input placeholder="Room" value={s.room} onChange={(e) => setSlot(i, "room", e.target.value)} />
            <button type="button" className="btn ghost" onClick={() => removeSlot(i)} aria-label="Remove">✕</button>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={addSlot}>+ Add class time</button>
        <button className="btn primary">Save course</button>
      </form>
    </Modal>
  );
}

// Grid of Mon–Sun columns with each class slot placed by its start time.
function WeeklyTimetable({ courses }) {
  const slots = courses.flatMap((c) => c.schedule.map((s) => ({ ...s, course: c })));
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startHour = Math.min(8, ...slots.map((s) => Math.floor(toMin(s.startTime) / 60)));
  const endHour = Math.max(18, ...slots.map((s) => Math.ceil(toMin(s.endTime) / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const PX_PER_MIN = 1; // 60px per hour

  return (
    <div className="card timetable">
      <div className="tt-hours">
        <div className="tt-head" />
        {hours.map((h) => (
          <div key={h} className="tt-hour">{String(h).padStart(2, "0")}:00</div>
        ))}
      </div>
      {DAYS.map((day) => (
        <div key={day} className="tt-day">
          <div className="tt-head">{day}</div>
          <div className="tt-body" style={{ height: hours.length * 60 * PX_PER_MIN }}>
            {slots
              .filter((s) => s.day === day)
              .map((s, i) => {
                const top = (toMin(s.startTime) - startHour * 60) * PX_PER_MIN;
                const height = (toMin(s.endTime) - toMin(s.startTime)) * PX_PER_MIN;
                return (
                  <div key={i} className="tt-slot" style={{ top, height, background: s.course.color }}>
                    <strong>{s.course.courseCode || s.course.courseName}</strong>
                    <span>{s.startTime}–{s.endTime}</span>
                    {s.room && <span>{s.room}</span>}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
