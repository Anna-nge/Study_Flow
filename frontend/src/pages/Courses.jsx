import { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const emptyForm = { courseName: "", courseCode: "", instructor: "", schedule: [] };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api("/api/courses").then((d) => setCourses(d.courses)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const addSlot = () =>
    setForm((f) => ({
      ...f,
      schedule: [...f.schedule, { day: "Mon", startTime: "09:00", endTime: "10:00", location: "" }],
    }));
  const setSlot = (i, key, value) =>
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));
  const removeSlot = (i) =>
    setForm((f) => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await api(`/api/courses/${editingId}`, { method: "PUT", body: form });
      else await api("/api/courses", { method: "POST", body: form });
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setForm({
      courseName: c.courseName,
      courseCode: c.courseCode,
      instructor: c.instructor,
      schedule: c.schedule,
    });
  }

  async function remove(id) {
    if (!window.confirm("Delete this course?")) return;
    await api(`/api/courses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>My Courses</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <h3>{editingId ? "Edit course" : "Add course"}</h3>
        <input placeholder="Course name" value={form.courseName} onChange={(e) => setField("courseName", e.target.value)} />
        <input placeholder="Course code (e.g. CS101)" value={form.courseCode} onChange={(e) => setField("courseCode", e.target.value)} />
        <input placeholder="Instructor" value={form.instructor} onChange={(e) => setField("instructor", e.target.value)} />

        {form.schedule.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <select value={s.day} onChange={(e) => setSlot(i, "day", e.target.value)}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input type="time" value={s.startTime} onChange={(e) => setSlot(i, "startTime", e.target.value)} />
            <input type="time" value={s.endTime} onChange={(e) => setSlot(i, "endTime", e.target.value)} />
            <input placeholder="Room" value={s.location} onChange={(e) => setSlot(i, "location", e.target.value)} />
            <button type="button" onClick={() => removeSlot(i)}>x</button>
          </div>
        ))}
        <button type="button" onClick={addSlot}>+ Add class time</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">{editingId ? "Save changes" : "Add course"}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {courses.length === 0 && <p>No courses yet.</p>}
      {courses.map((c) => (
        <div key={c._id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8, borderRadius: 6 }}>
          <strong>{c.courseName}</strong> {c.courseCode && `(${c.courseCode})`}
          <div>{c.instructor}</div>
          <div style={{ fontSize: 14 }}>
            {c.schedule.map((s, i) => (
              <span key={i} style={{ marginRight: 10 }}>
                {s.day} {s.startTime}-{s.endTime} {s.location}
              </span>
            ))}
          </div>
          <button onClick={() => startEdit(c)}>Edit</button>{" "}
          <button onClick={() => remove(c._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}