import mongoose from "mongoose";

const curriculumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    modules: [
      {
        title: String,
        units: [
          {
            title: String,
            lessons: [
              {
                title: String,
                completed: { type: Boolean, default: false },
                progress: { type: Number, default: 0 }
              }
            ]
          }
        ]
      }
    ],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Curriculum", curriculumSchema);
