import mongoose from "mongoose";

export const PRIORITIES = ["Low", "Medium", "High"];
export const STATUSES = ["InProgress", "Completed"];

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 200 },
    description: { type: String, default: "" },
    dueDate: { type: Date, required: [true, "Due date is required"] },
    priority: { type: String, enum: PRIORITIES, default: "Medium" },
    status: { type: String, enum: STATUSES, default: "InProgress" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Keep completedAt in sync with status.
taskSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.completedAt = this.status === "Completed" ? new Date() : null;
  }
});

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
