import { useEffect, useState } from "react";
import { api } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Schedule() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api("/api/courses").then((d) => setCourses(d.courses)).catch(() => {});
  }, []);

  const byDay = (day) =>
    courses
      .flatMap((c) => c.schedule.filter((s) => s.day === day).map((s) => ({ course: c, slot: s })))
      .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));

  return (
    <div style={{ padding: 24 }}>
      <h2>Weekly Schedule</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {DAYS.map((day) => (
          <div key={day} style={{ border: "1px solid #ccc", borderRadius: 6, padding: 8, minHeight: 120 }}>
            <strong>{day}</strong>
            {byDay(day).map(({ course, slot }, i) => (
              <div key={i} style={{ background: "#e8f0fe", borderRadius: 4, padding: 6, marginTop: 6, fontSize: 13 }}>
                <div><strong>{course.courseName}</strong></div>
                <div>{slot.startTime}-{slot.endTime}</div>
                {slot.location && <div>{slot.location}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}