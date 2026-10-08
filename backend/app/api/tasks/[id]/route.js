import Task from "@/models/Task";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { findOwned, assertCourseOwned } from "@/lib/ownership";

const FIELDS = ["courseId", "title", "description", "dueDate", "priority", "status"];

// GET /api/tasks/:id
export const GET = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  return json({ task: await findOwned(Task, id, user._id) });
});

// PUT /api/tasks/:id — partial update; send { status } to toggle
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const task = await findOwned(Task, id, user._id);
  const body = pick(await readBody(req), FIELDS);
  if (body.courseId === "") body.courseId = null;
  await assertCourseOwned(body.courseId, user._id);
  Object.assign(task, body);
  await task.save();
  return json({ task });
});

// DELETE /api/tasks/:id
export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const task = await findOwned(Task, id, user._id);
  await task.deleteOne();
  return json({ message: "Task deleted" });
});
