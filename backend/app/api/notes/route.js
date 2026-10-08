import Note from "@/models/Note";
import { handler, json, readBody, pick, escapeRegex } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { assertCourseOwned } from "@/lib/ownership";

const FIELDS = ["courseId", "title", "content", "tags"];

// GET /api/notes?q=&courseId=&tag=
// q searches title, content and tags (case-insensitive).
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const sp = new URL(req.url).searchParams;
  const filter = { userId: user._id };
  if (sp.get("courseId")) filter.courseId = sp.get("courseId");
  if (sp.get("tag")) filter.tags = sp.get("tag").toLowerCase();
  if (sp.get("q")) {
    const rx = new RegExp(escapeRegex(sp.get("q")), "i");
    filter.$or = [{ title: rx }, { content: rx }, { tags: rx }];
  }
  const notes = await Note.find(filter)
    .sort({ updatedAt: -1 })
    .populate("courseId", "courseName courseCode color");
  return json({ notes });
});

// POST /api/notes  { courseId, title, content, tags: [] }
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const body = pick(await readBody(req), FIELDS);
  await assertCourseOwned(body.courseId, user._id);
  const note = await Note.create({ ...body, userId: user._id });
  return json({ note }, 201);
});
