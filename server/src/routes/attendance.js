import { Router } from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.post("/mark", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { studentId, studentEmail, class: klass, date, status } = req.body || {};
  if (!status || !["present", "absent", "late"].includes(status) || !klass) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    let sid = studentId;
    if (!sid && studentEmail) {
      const u = await User.findOne({ email: studentEmail, role: "student" }).lean();
      if (!u) return res.status(404).json({ error: "Student not found" });
      sid = u._id;
    }
    if (!sid) return res.status(400).json({ error: "Missing student" });
    const when = date ? new Date(date) : new Date();
    const record = await Attendance.findOneAndUpdate(
      { student: sid, date: new Date(when.toDateString()) },
      { student: sid, class: klass, status, timestamp: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ id: record._id });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/daily", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { class: klass, date } = req.query || {};
  if (!klass) return res.status(400).json({ error: "Missing class" });
  const when = date ? new Date(date) : new Date();
  try {
    const day = new Date(when.toDateString());
    const list = await Attendance.find({ class: klass, date: day })
      .populate({ path: "student", select: "name email" })
      .lean();
    res.json({ list });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/classes", auth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const classes = await Attendance.distinct("class");
    res.json({ list: classes });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/history/:studentId", auth, async (req, res) => {
  const { studentId } = req.params;
  const { from, to } = req.query || {};
  if (!studentId) return res.status(400).json({ error: "Missing studentId" });
  try {
    const q = { student: studentId };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = new Date(from);
      if (to) q.date.$lte = new Date(to);
    }
    const list = await Attendance.find(q).sort({ date: -1 }).lean();
    res.json({ list });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/stats", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { class: klass, from, to } = req.query || {};
  const match = {};
  if (klass) match.class = klass;
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  try {
    const data = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: { date: "$date", status: "$status" }, count: { $sum: 1 } } },
      { $group: { _id: "$_id.date", buckets: { $push: { k: "$_id.status", v: "$count" } } } },
      { $project: { _id: 0, date: "$_id", counts: { $arrayToObject: "$buckets" } } },
      { $sort: { date: 1 } }
    ]);
    res.json({ list: data });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
