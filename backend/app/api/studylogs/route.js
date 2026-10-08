import StudyLog from "@/models/StudyLog";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { assertCourseOwned } from "@/lib/ownership";

const FIELDS = ["courseId", "durationMinutes", "completedAt", "note"];

// GET /api/studylogs?from=&to=&courseId=&limit=
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const sp = new URL(req.url).searchParams;
  const filter = { userId: user._id };
  if (sp.get("courseId")) filter.courseId = sp.get("courseId");
  if (sp.get("from") || sp.get("to")) {
    filter.completedAt = {};
    if (sp.get("from")) filter.completedAt.$gte = new Date(sp.get("from"));
    if (sp.get("to")) filter.completedAt.$lte = new Date(sp.get("to"));
  }
  const limit = Math.min(Number(sp.get("limit")) || 100, 500);
  const logs = await StudyLog.find(filter)
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate("courseId", "courseName courseCode color");
  return json({ logs });
});

// POST /api/studylogs  { durationMinutes, courseId?, completedAt?, note? }
// Called by the Pomodoro timer when a focus session finishes.
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const body = pick(await readBody(req), FIELDS);
  if (body.courseId === "") body.courseId = null;
  await assertCourseOwned(body.courseId, user._id);
  const log = await StudyLog.create({ ...body, userId: user._id });
  return json({ log }, 201);
});
