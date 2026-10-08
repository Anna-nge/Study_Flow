import Course from "@/models/Course";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const FIELDS = ["courseName", "courseCode", "instructor", "color", "schedule"];

// GET /api/courses — the current user's courses
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const courses = await Course.find({ userId: user._id }).sort({ courseName: 1 });
  return json({ courses });
});

// POST /api/courses  { courseName, courseCode, instructor, color, schedule: [{day,startTime,endTime,room}] }
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const body = pick(await readBody(req), FIELDS);
  const course = await Course.create({ ...body, userId: user._id });
  return json({ course }, 201);
});
