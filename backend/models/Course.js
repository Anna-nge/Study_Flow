import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "10:30"
    location: { type: String, default: "" },
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseName: { type: String, required: true, trim: true },
    courseCode: { type: String, trim: true, default: "" },
    instructor: { type: String, trim: true, default: "" },
    schedule: { type: [ScheduleSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);