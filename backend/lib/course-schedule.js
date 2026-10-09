import Course from "@/models/Course";
import { ApiError } from "@/lib/api";

// Reject any time overlap between this schedule and another course owned by
// the same user. Adjacent classes (for example, 09:00–10:00 and 10:00–11:00)
// are allowed.
export async function assertNoCourseTimeConflict(schedule = [], userId, excludeCourseId) {
  if (!schedule.length) return;

  const filter = { userId };
  if (excludeCourseId) filter._id = { $ne: excludeCourseId };
  const courses = await Course.find(filter).select("schedule").lean();

  const hasConflict = courses.some((course) =>
    (course.schedule || []).some((existing) =>
      schedule.some((slot) =>
        slot.day === existing.day &&
        slot.startTime < existing.endTime &&
        existing.startTime < slot.endTime
      )
    )
  );

  if (hasConflict) throw new ApiError(409, "Time Conflict");
}
