import Course from "@/models/Course";
import Note from "@/models/Note";
import Task from "@/models/Task";
import StudyLog from "@/models/StudyLog";

// Remove everything a user owns (used when a user is deleted).
export async function deleteUserData(userId) {
  await Promise.all([
    Course.deleteMany({ userId }),
    Note.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    StudyLog.deleteMany({ userId }),
  ]);
}

// When a course is deleted: its notes go with it; tasks and study logs
// are kept but detached so the user's history and hours are not lost.
export async function deleteCourseData(courseId, userId) {
  await Promise.all([
    Note.deleteMany({ courseId, userId }),
    Task.updateMany({ courseId, userId }, { courseId: null }),
    StudyLog.updateMany({ courseId, userId }, { courseId: null }),
  ]);
}
