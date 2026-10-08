import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { CourseBadge, Empty, ErrorBox, PageHeader, fmtDate, fmtMinutes } from "../components/ui";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsApi.summary().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox error={error} />;
  if (!data) return <div className="muted">Loading dashboard…</div>;

  const maxDay = Math.max(30, ...data.last7Days.map((d) => d.minutes));
  const daysLeft = (d) => Math.ceil((new Date(d) - Date.now()) / 86400000);

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`}>
        <Link className="btn primary" to="/focus">Start focusing</Link>
      </PageHeader>

      <div className="stats">
        <Stat label="Total hours studied" value={data.totalHours} sub={`${data.sessions} sessions`} />
        <Stat label="Last 7 days" value={fmtMinutes(data.minutesThisWeek)} />
        <Stat label="Open tasks" value={data.tasks.inProgress} sub={data.tasks.overdue ? `${data.tasks.overdue} overdue` : "none overdue"} warn={data.tasks.overdue > 0} />
        <Stat label="Tasks completed" value={`${data.tasks.completed}/${data.tasks.total}`} />
        <Stat label="Courses · Notes" value={`${data.courseCount} · ${data.noteCount}`} />
      </div>

      <div className="dash-grid">
        <section className="card">
          <h3>Study time, last 7 days</h3>
          <div className="bars">
            {data.last7Days.map((d) => (
              <div key={d.date} className="bar-col" title={`${d.date}: ${fmtMinutes(d.minutes)}`}>
                <span className="bar-value">{d.minutes ? fmtMinutes(d.minutes) : ""}</span>
                <div className="bar" style={{ height: `${(d.minutes / maxDay) * 100}%` }} />
                <span className="bar-label">
                  {new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Upcoming deadlines</h3>
          {data.upcomingDeadlines.length === 0 ? (
            <Empty>Nothing due. Nice.</Empty>
          ) : (
            <ul className="deadline-list">
              {data.upcomingDeadlines.map((t) => (
                <li key={t._id}>
                  <div>
                    <strong>{t.title}</strong>
                    <div className="row small">
                      <span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span>
                      <CourseBadge course={t.courseId} />
                    </div>
                  </div>
                  <div className="right small">
                    <div>{fmtDate(t.dueDate)}</div>
                    <div className="muted">{daysLeft(t.dueDate) <= 1 ? "due soon" : `in ${daysLeft(t.dueDate)} days`}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/tasks" className="small">All tasks →</Link>
        </section>

        <section className="card span-2">
          <h3>Course progress</h3>
          {data.courseProgress.length === 0 ? (
            <Empty>Add courses to track progress. <Link to="/courses">Go to courses</Link></Empty>
          ) : (
            <table className="progress-table">
              <thead>
                <tr><th>Course</th><th>Tasks done</th><th>Progress</th><th>Study time</th></tr>
              </thead>
              <tbody>
                {data.courseProgress.map((c) => (
                  <tr key={c.courseId}>
                    <td><span className="dot" style={{ background: c.color }} /> {c.courseCode && `${c.courseCode} · `}{c.courseName}</td>
                    <td>{c.tasksCompleted}/{c.tasksTotal}</td>
                    <td>
                      <div className="progress"><div style={{ width: `${c.progress}%`, background: c.color }} /></div>
                      <span className="small muted">{c.progress}%</span>
                    </td>
                    <td>{fmtMinutes(c.studyMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, sub, warn }) {
  return (
    <div className="card stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {sub && <span className={`small ${warn ? "danger-text" : "muted"}`}>{sub}</span>}
    </div>
  );
}
