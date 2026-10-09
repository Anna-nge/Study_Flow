import Course from "@/models/Course";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { findOwned } from "@/lib/ownership";
import { deleteCourseData } from "@/lib/cascade";
import { assertNoCourseTimeConflict } from "@/lib/course-schedule";

const FIELDS = ["courseName", "courseCode", "instructor", "color", "schedule"];

// GET /api/courses/:id
export const GET = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  return json({ course: await findOwned(Course, id, user._id) });
});

// PUT /api/courses/:id
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const course = await findOwned(Course, id, user._id);
  const body = pick(await readBody(req), FIELDS);
  if (body.schedule !== undefined) await assertNoCourseTimeConflict(body.schedule, user._id, course._id);
  Object.assign(course, body);
  await course.save();
  return json({ course });
});

// DELETE /api/courses/:id — also deletes its notes, detaches tasks/logs
export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const course = await findOwned(Course, id, user._id);
  await deleteCourseData(course._id, user._id);
  await course.deleteOne();
  return json({ message: "Course deleted" });
});
