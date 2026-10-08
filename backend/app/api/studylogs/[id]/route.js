import StudyLog from "@/models/StudyLog";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { findOwned, assertCourseOwned } from "@/lib/ownership";

const FIELDS = ["courseId", "durationMinutes", "completedAt", "note"];

// GET /api/studylogs/:id
export const GET = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  return json({ log: await findOwned(StudyLog, id, user._id) });
});

// PUT /api/studylogs/:id
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const log = await findOwned(StudyLog, id, user._id);
  const body = pick(await readBody(req), FIELDS);
  if (body.courseId === "") body.courseId = null;
  await assertCourseOwned(body.courseId, user._id);
  Object.assign(log, body);
  await log.save();
  return json({ log });
});

// DELETE /api/studylogs/:id
export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const log = await findOwned(StudyLog, id, user._id);
  await log.deleteOne();
  return json({ message: "Study log deleted" });
});
