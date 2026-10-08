import mongoose from "mongoose";
import Course from "@/models/Course";
import Task from "@/models/Task";
import StudyLog from "@/models/StudyLog";
import Note from "@/models/Note";
import { handler, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

// GET /api/analytics/summary?tz=Asia/Yangon
// Everything the dashboard needs in one request.
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const userId = new mongoose.Types.ObjectId(user._id);
  const tz = validTimeZone(new URL(req.url).searchParams.get("tz"));
  const now = new Date();
  // 7 full days back covers "today + previous 6 days" in any time zone;
  // extra entries are ignored when building last7Days below.
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [totals, daily, byCourse, courses, taskStats, upcoming, overdueCount, noteCount] = await Promise.all([
    StudyLog.aggregate([
      { $match: { userId } },
      { $group: { _id: null, minutes: { $sum: "$durationMinutes" }, sessions: { $sum: 1 } } },
    ]),
    StudyLog.aggregate([
      { $match: { userId, completedAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: tz } },
          minutes: { $sum: "$durationMinutes" },
        },
      },
    ]),
    StudyLog.aggregate([
      { $match: { userId } },
      { $group: { _id: "$courseId", minutes: { $sum: "$durationMinutes" } } },
    ]),
    Course.find({ userId }).select("courseName courseCode color").lean(),
    Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$courseId",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        },
      },
    ]),
    Task.find({ userId, status: "InProgress", dueDate: { $gte: now } })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate("courseId", "courseName courseCode color")
      .lean(),
    Task.countDocuments({ userId, status: "InProgress", dueDate: { $lt: now } }),
    Note.countDocuments({ userId }),
  ]);

  // Last 7 days, oldest first, filling days with no study as 0.
  const dailyMap = Object.fromEntries(daily.map((d) => [d._id, d.minutes]));
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = fmt.format(new Date(now.getTime() - (6 - i) * DAY_MS));
    return { date, minutes: dailyMap[date] || 0 };
  });

  const minutesMap = Object.fromEntries(byCourse.map((r) => [String(r._id), r.minutes]));
  const taskMap = Object.fromEntries(taskStats.map((r) => [String(r._id), r]));
  const courseProgress = courses.map((c) => {
    const t = taskMap[String(c._id)] || { total: 0, completed: 0 };
    return {
      courseId: c._id,
      courseName: c.courseName,
      courseCode: c.courseCode,
      color: c.color,
      studyMinutes: minutesMap[String(c._id)] || 0,
      tasksTotal: t.total,
      tasksCompleted: t.completed,
      progress: t.total ? Math.round((t.completed / t.total) * 100) : 0,
    };
  });

  const totalTasks = taskStats.reduce((s, r) => s + r.total, 0);
  const completedTasks = taskStats.reduce((s, r) => s + r.completed, 0);
  const totalMinutes = totals[0]?.minutes || 0;

  return json({
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    sessions: totals[0]?.sessions || 0,
    minutesThisWeek: last7Days.reduce((s, d) => s + d.minutes, 0),
    last7Days,
    courseCount: courses.length,
    noteCount,
    tasks: { total: totalTasks, completed: completedTasks, inProgress: totalTasks - completedTasks, overdue: overdueCount },
    upcomingDeadlines: upcoming,
    courseProgress,
  });
});

function validTimeZone(tz) {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}
