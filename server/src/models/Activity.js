import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    submissions: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        url: String,
        grade: Number,
        feedback: String,
        submittedAt: Date
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
