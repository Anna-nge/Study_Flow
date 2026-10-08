import User from "@/models/User";
import Course from "@/models/Course";
import Note from "@/models/Note";
import Task from "@/models/Task";
import StudyLog from "@/models/StudyLog";
import { handler, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

// GET /api/analytics/admin — platform-wide totals for the Admin page
export const GET = handler(async (req) => {
  await requireAdmin(req);
  const [users, admins, courses, notes, tasks, minutes] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "Admin" }),
    Course.countDocuments(),
    Note.countDocuments(),
    Task.countDocuments(),
    StudyLog.aggregate([{ $group: { _id: null, m: { $sum: "$durationMinutes" } } }]),
  ]);
  return json({ users, admins, students: users - admins, courses, notes, tasks, studyMinutes: minutes[0]?.m || 0 });
});
