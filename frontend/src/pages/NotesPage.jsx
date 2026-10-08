import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notesApi } from "../api";
import { CourseBadge, CourseSelect, Empty, ErrorBox, PageHeader, fmtDateTime, useCourses } from "../components/ui";

export default function NotesPage() {
  const courses = useCourses();
  const [notes, setNotes] = useState([]);
  const [filters, setFilters] = useState({ q: "", courseId: "", tag: "" });
  const [selected, setSelected] = useState(null); // note being edited; {} for a new note
  const [error, setError] = useState("");

  const load = () => notesApi.list(filters).then((d) => setNotes(d.notes)).catch((e) => setError(e.message));

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce typing in search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort();

  const newNote = () => {
    if (!courses.length) return setError("Create a course first. Notes belong to a course.");
    setSelected({ title: "", content: "", tags: [], courseId: filters.courseId || courses[0]._id });
  };

  return (
    <>
      <PageHeader title="Class notes">
        <button className="btn primary" onClick={newNote}>New note</button>
      </PageHeader>
      <ErrorBox error={error} />

      <div className="notes-layout">
        <aside className="card notes-list">
          <input
            placeholder="Search notes…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <CourseSelect
            courses={courses}
            value={filters.courseId}
            noneLabel="All courses"
            onChange={(courseId) => setFilters({ ...filters, courseId })}
          />
          {allTags.length > 0 && (
            <div className="tags">
              {allTags.map((t) => (
                <button
                  key={t}
                  className={`tag ${filters.tag === t ? "active" : ""}`}
                  onClick={() => setFilters({ ...filters, tag: filters.tag === t ? "" : t })}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
          {notes.length === 0 && <Empty>No notes found.</Empty>}
          <ul>
            {notes.map((n) => (
              <li
                key={n._id}
                className={selected?._id === n._id ? "active" : ""}
                onClick={() => setSelected({ ...n, courseId: n.courseId?._id || n.courseId })}
              >
                <strong>{n.title}</strong>
                <div className="row small">
                  <CourseBadge course={n.courseId} />
                  <span className="muted">{fmtDateTime(n.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="card note-editor">
          {selected ? (
            <NoteEditor
              key={selected._id || "new"}
              note={selected}
              courses={courses}
              onSaved={(note) => {
                setSelected({ ...note, courseId: note.courseId?._id || note.courseId });
                load();
              }}
              onDeleted={() => {
                setSelected(null);
                load();
              }}
            />
          ) : (
            <Empty>Select a note or create a new one.</Empty>
          )}
        </section>
      </div>
    </>
  );
}

function NoteEditor({ note, courses, onSaved, onDeleted }) {
  const [form, setForm] = useState({ ...note, tagsText: (note.tags || []).join(", ") });
  const [mode, setMode] = useState(note._id ? "preview" : "write");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError("");
    const body = {
      title: form.title,
      content: form.content,
      courseId: form.courseId,
      tags: form.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      const { note: saved } = note._id ? await notesApi.update(note._id, body) : await notesApi.create(body);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this note?")) return;
    try {
      await notesApi.remove(note._id);
      onDeleted();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="form">
      <ErrorBox error={error} />
      <input
        className="title-input"
        placeholder="Note title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <div className="row">
        <CourseSelect courses={courses} allowNone={false} value={form.courseId} onChange={(courseId) => setForm({ ...form, courseId })} />
        <input placeholder="Tags, comma separated" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
      </div>
      <div className="segmented">
        <button type="button" className={mode === "write" ? "active" : ""} onClick={() => setMode("write")}>Write</button>
        <button type="button" className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")}>Preview</button>
      </div>
      {mode === "write" ? (
        <textarea
          className="md-input"
          placeholder={"# Heading\n\n- bullet\n**bold**, `code`, tables and checklists are supported"}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
      ) : (
        <div className="markdown">
          {form.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown> : <p className="muted">Nothing written yet.</p>}
        </div>
      )}
      <div className="row">
        <button className="btn primary" onClick={save} disabled={saving || !form.title}>
          {saving ? "Saving…" : "Save note"}
        </button>
        {note._id && <button className="btn danger" onClick={remove}>Delete</button>}
      </div>
    </div>
  );
}
