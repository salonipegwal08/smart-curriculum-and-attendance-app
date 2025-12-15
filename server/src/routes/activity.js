import { Router } from "express";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.resolve(process.cwd(), "uploads", "activity");
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const name = `${req.params.id}-${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  }
});
const allowedTypes = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (allowedTypes.has(file.mimetype)) cb(null, true);
    else cb(null, false);
  }
});

router.post("/", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { title, description, dueDate, assignedEmails = [], assignedIds = [] } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing title" });
  try {
    let assignedTo = assignedIds;
    if (assignedEmails.length) {
      const students = await User.find({ email: { $in: assignedEmails }, role: "student" }, { _id: 1 }).lean();
      assignedTo = [...assignedTo, ...students.map((s) => s._id)];
    }
    const doc = await Activity.create({ title, description, dueDate, createdBy: req.user.id, assignedTo });
    res.status(201).json({ id: doc._id });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/mine", auth, requireRole("teacher", "admin"), async (req, res) => {
  const list = await Activity.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate({ path: "submissions.student", select: "name email" })
    .lean();
  res.json({ list });
});

router.get("/assigned", auth, async (req, res) => {
  const list = await Activity.find({ assignedTo: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ list });
});

router.post("/:id/submit", auth, requireRole("student"), async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });
  try {
    const doc = await Activity.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    doc.submissions = doc.submissions || [];
    const existing = doc.submissions.find((s) => String(s.student) === String(req.user.id));
    if (existing) {
      existing.url = url;
      existing.submittedAt = new Date();
    } else {
      doc.submissions.push({ student: req.user.id, url, submittedAt: new Date() });
    }
    await doc.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/grade", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { studentId, grade, feedback } = req.body || {};
  if (!studentId || typeof grade !== "number") return res.status(400).json({ error: "Invalid payload" });
  try {
    const doc = await Activity.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    const sub = doc.submissions.find((s) => String(s.student) === String(studentId));
    if (!sub) return res.status(400).json({ error: "Submission not found" });
    sub.grade = grade;
    if (typeof feedback === "string") sub.feedback = feedback;
    await doc.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const doc = await Activity.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (String(doc.createdBy) !== String(req.user.id)) return res.status(403).json({ error: "Forbidden" });
    await Activity.deleteOne({ _id: doc._id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/upload", auth, requireRole("student"), (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large (max 20MB)" });
      return res.status(400).json({ error: "Upload error" });
    }
    if (!req.file) return res.status(400).json({ error: "Unsupported file type" });
    try {
      const doc = await Activity.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: "Not found" });
      if (!doc.assignedTo.map(String).includes(String(req.user.id))) return res.status(403).json({ error: "Forbidden" });
      const publicUrl = `/uploads/activity/${req.file.filename}`;
      doc.submissions = doc.submissions || [];
      const existing = doc.submissions.find((s) => String(s.student) === String(req.user.id));
      if (existing) {
        existing.url = publicUrl;
        existing.submittedAt = new Date();
      } else {
        doc.submissions.push({ student: req.user.id, url: publicUrl, submittedAt: new Date() });
      }
      await doc.save();
      res.json({ ok: true, url: publicUrl });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });
});

export default router;
