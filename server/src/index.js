import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import authRouter from "./routes/auth.js";
import attendanceRouter from "./routes/attendance.js";
import curriculumRouter from "./routes/curriculum.js";
import activityRouter from "./routes/activity.js";
import adminRouter from "./routes/admin.js";
import announcementRouter from "./routes/announcement.js";
import notificationRouter from "./routes/notification.js";
import usersRouter from "./routes/users.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const uploadsDir = path.resolve(process.cwd(), "uploads");
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
app.use("/uploads", express.static(uploadsDir));

const PORT = process.env.PORT || 5000;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/curriculum", curriculumRouter);
app.use("/api/activity", activityRouter);
app.use("/api/admin", adminRouter);
app.use("/api/announcement", announcementRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/users", usersRouter);

const { MONGO_URI } = process.env;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI).catch(() => {});
}

app.listen(PORT, () => {});
