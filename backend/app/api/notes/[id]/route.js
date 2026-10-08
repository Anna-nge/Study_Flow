import Note from "@/models/Note";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { findOwned, assertCourseOwned } from "@/lib/ownership";

const FIELDS = ["courseId", "title", "content", "tags"];

// GET /api/notes/:id
export const GET = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  return json({ note: await findOwned(Note, id, user._id) });
});

// PUT /api/notes/:id
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const note = await findOwned(Note, id, user._id);
  const body = pick(await readBody(req), FIELDS);
  await assertCourseOwned(body.courseId, user._id);
  Object.assign(note, body);
  await note.save();
  return json({ note });
});

// DELETE /api/notes/:id
export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const note = await findOwned(Note, id, user._id);
  await note.deleteOne();
  return json({ message: "Note deleted" });
});
