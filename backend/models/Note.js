import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: [true, "Course is required"] },
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 200 },
    content: { type: String, default: "" }, // markdown
    tags: {
      type: [String],
      default: [],
      set: (tags) => [...new Set((tags || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))],
    },
  },
  { timestamps: true, versionKey: false } // updatedAt
);

export default mongoose.models.Note || mongoose.model("Note", noteSchema);
