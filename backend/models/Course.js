import mongoose from "mongoose";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:mm"

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    startTime: { type: String, required: true, match: [TIME, "Time must be HH:mm"] },
    endTime: { type: String, required: true, match: [TIME, "Time must be HH:mm"] },
    room: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

slotSchema.pre("validate", function () {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate("endTime", "End time must be after start time");
  }
});

const courseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseName: { type: String, required: [true, "Course name is required"], trim: true },
    courseCode: { type: String, trim: true, default: "" },
    instructor: { type: String, trim: true, default: "" },
    color: { type: String, default: "#6366f1" },
    schedule: { type: [slotSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
