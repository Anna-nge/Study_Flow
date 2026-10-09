import User from "@/models/User";
import Course from "@/models/Course";
import Task from "@/models/Task";
import StudyLog from "@/models/StudyLog";
import { handler, json, readBody, pick, escapeRegex } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
// GET /api/users?q= — Admin: list users with a few usage counts
export const GET = handler(async (req) => {
  await requireAdmin(req);
  const q = new URL(req.url).searchParams.get("q");
  const filter = q
    ? { $or: [{ name: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }] }
    : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  const ids = users.map((u) => u._id);
  const [courses, tasks, minutes] = await Promise.all([
    Course.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", n: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", n: { $sum: 1 } } }]),
    StudyLog.aggregate([
      { $match: { userId: { $in: ids } } },
      { $group: { _id: "$userId", n: { $sum: "$durationMinutes" } } },
    ]),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id.toString(), r.n]));
  const [c, t, m] = [toMap(courses), toMap(tasks), toMap(minutes)];
  return json({
    users: users.map(({ password, __v, ...u }) => ({
      ...u,
      courseCount: c[u._id] || 0,
      taskCount: t[u._id] || 0,
      studyMinutes: m[u._id] || 0,
    })),
  });
});
// POST /api/users — Admin: create a user with any role
export const POST = handler(async (req) => {
  await requireAdmin(req);
  const body = pick(await readBody(req), ["name", "email", "password", "role"]);
  const user = await User.create(body);
  return json({ user }, 201);
});
 