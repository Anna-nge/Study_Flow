import Course from "@/models/Course";
import { ApiError } from "./api";

// Find a document by id that belongs to the user, or throw 404.
// Returning 404 (not 403) avoids revealing other users' ids.
export async function findOwned(Model, id, userId) {
  const doc = await Model.findOne({ _id: id, userId });
  if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
  return doc;
}

// Make sure a courseId sent by the client belongs to the same user.
export async function assertCourseOwned(courseId, userId) {
  if (!courseId) return;
  const exists = await Course.exists({ _id: courseId, userId });
  if (!exists) throw new ApiError(400, "Course not found");
}
