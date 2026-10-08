import Task from "@/models/Task";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { assertCourseOwned } from "@/lib/ownership";

const FIELDS = ["courseId", "title", "description", "dueDate", "priority", "status"];

// GET /api/tasks?status=&priority=&courseId=
// Sorted by due date (soonest first).
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const sp = new URL(req.url).searchParams;
  const filter = { userId: user._id };
  for (const key of ["status", "priority", "courseId"]) {
    if (sp.get(key)) filter[key] = sp.get(key);
  }
  const tasks = await Task.find(filter)
    .sort({ status: 1, dueDate: 1 })
    .populate("courseId", "courseName courseCode color");
  return json({ tasks });
});

// POST /api/tasks  { title, dueDate, priority, status, courseId?, description? }
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const body = pick(await readBody(req), FIELDS);
  if (body.courseId === "") body.courseId = null;
  await assertCourseOwned(body.courseId, user._id);
  const task = await Task.create({ ...body, userId: user._id });
  return json({ task }, 201);
});
