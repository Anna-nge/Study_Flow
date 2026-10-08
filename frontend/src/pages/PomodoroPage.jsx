import { useEffect, useRef, useState } from "react";
import { studyLogsApi } from "../api";
import { CourseBadge, CourseSelect, Empty, ErrorBox, PageHeader, fmtDateTime, fmtMinutes, useCourses } from "../components/ui";

const SETTINGS_KEY = "studyflow_pomodoro";
const defaults = { work: 25, shortBreak: 5, longBreak: 15, rounds: 4 };

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return defaults;
  }
}

const LABELS = { work: "Focus", shortBreak: "Short break", longBreak: "Long break" };

export default function PomodoroPage() {
  const courses = useCourses();
  const [settings, setSettings] = useState(loadSettings);
  const [mode, setMode] = useState("work");
  const [remaining, setRemaining] = useState(settings.work * 60); // seconds
  const [running, setRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [courseId, setCourseId] = useState("");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const endAt = useRef(null); // timestamp the current phase ends; survives tab throttling

  const loadLogs = () => studyLogsApi.list({ limit: 20 }).then((d) => setLogs(d.logs)).catch((e) => setError(e.message));
  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Tick: compute remaining from the end timestamp instead of counting down,
  // so the timer stays correct if the browser throttles background tabs.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        finishPhase();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    document.title = running ? `${m}:${s} · ${LABELS[mode]}` : "StudyFlow";
    return () => {
      document.title = "StudyFlow";
    };
  }, [remaining, running, mode]);

  const switchMode = (next) => {
    setRunning(false);
    setMode(next);
    setRemaining(settings[next] * 60);
  };

  const logSession = async (minutes) => {
    if (minutes < 1) return;
    try {
      await studyLogsApi.create({ durationMinutes: minutes, courseId: courseId || null, completedAt: new Date().toISOString() });
      loadLogs();
    } catch (e) {
      setError(e.message);
    }
  };

  const finishPhase = () => {
    setRunning(false);
    beep();
    if (mode === "work") {
      logSession(settings.work);
      const rounds = completedRounds + 1;
      setCompletedRounds(rounds);
      switchMode(rounds % settings.rounds === 0 ? "longBreak" : "shortBreak");
    } else {
      switchMode("work");
    }
  };

  const start = () => {
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => switchMode(mode);

  // Stop a focus session early and still log the minutes already studied.
  const stopAndLog = () => {
    const studied = Math.floor((settings.work * 60 - remaining) / 60);
    setRunning(false);
    logSession(studied);
    setRemaining(settings.work * 60);
  };

  const updateSetting = (k, v) => {
    const next = { ...settings, [k]: Math.max(1, Math.min(k === "rounds" ? 10 : 180, Number(v) || 1)) };
    setSettings(next);
    if (!running && k === mode) setRemaining(next[k] * 60);
  };

  const removeLog = async (log) => {
    try {
      await studyLogsApi.remove(log._id);
      loadLogs();
    } catch (e) {
      setError(e.message);
    }
  };

  const editLog = async (log) => {
    const v = prompt("Minutes studied", log.durationMinutes);
    if (v === null) return;
    try {
      await studyLogsApi.update(log._id, { durationMinutes: Number(v) });
      loadLogs();
    } catch (e) {
      setError(e.message);
    }
  };

  const total = settings[mode] * 60;
  const pct = total ? ((total - remaining) / total) * 100 : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <>
      <PageHeader title="Focus timer" />
      <ErrorBox error={error} />
      <div className="pomodoro-layout">
        <section className={`card timer ${mode}`}>
          <div className="segmented">
            {Object.keys(LABELS).map((m) => (
              <button key={m} className={mode === m ? "active" : ""} onClick={() => switchMode(m)} disabled={running}>
                {LABELS[m]}
              </button>
            ))}
          </div>
          <div className="ring" style={{ "--pct": `${pct}%` }}>
            <div className="time">{mm}:{ss}</div>
          </div>
          <p className="muted">Round {(completedRounds % settings.rounds) + 1} of {settings.rounds}</p>
          <label className="inline">
            Studying
            <CourseSelect courses={courses} value={courseId} onChange={setCourseId} noneLabel="General study" disabled={running} />
          </label>
          <div className="row center">
            {running ? <button className="btn primary" onClick={pause}>Pause</button> : <button className="btn primary" onClick={start}>Start</button>}
            <button className="btn ghost" onClick={reset}>Reset</button>
            {mode === "work" && remaining < total && <button className="btn ghost" onClick={stopAndLog}>Stop & log</button>}
          </div>
        </section>

        <section className="card">
          <h3>Settings (minutes)</h3>
          <div className="settings">
            <label>Focus<input type="number" min={1} max={180} value={settings.work} onChange={(e) => updateSetting("work", e.target.value)} disabled={running} /></label>
            <label>Short break<input type="number" min={1} max={180} value={settings.shortBreak} onChange={(e) => updateSetting("shortBreak", e.target.value)} disabled={running} /></label>
            <label>Long break<input type="number" min={1} max={180} value={settings.longBreak} onChange={(e) => updateSetting("longBreak", e.target.value)} disabled={running} /></label>
            <label>Rounds before long break<input type="number" min={1} max={10} value={settings.rounds} onChange={(e) => updateSetting("rounds", e.target.value)} disabled={running} /></label>
          </div>

          <h3>Recent sessions</h3>
          {logs.length === 0 ? (
            <Empty>No sessions logged yet. Finish a focus round to log one.</Empty>
          ) : (
            <ul className="log-list">
              {logs.map((l) => (
                <li key={l._id}>
                  <strong>{fmtMinutes(l.durationMinutes)}</strong>
                  {l.courseId ? <CourseBadge course={l.courseId} /> : <span className="muted small">General</span>}
                  <span className="muted small">{fmtDateTime(l.completedAt)}</span>
                  <span className="spacer" />
                  <button className="btn ghost small" onClick={() => editLog(l)}>Edit</button>
                  <button className="btn ghost small danger-text" onClick={() => removeLog(l)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

// Short notification sound using the Web Audio API (no audio file needed).
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* audio not available */
  }
}
