import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import Announcement from "../models/Announcement.js";

const router = Router();

router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { title, body, audience = "all" } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing title" });
  try {
    const doc = await Announcement.create({ title, body, audience, createdBy: req.user.id });
    res.status(201).json({ id: doc._id });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  const role = req.user?.role || "student";
  const aud = role === "admin" ? ["all", "teachers", "students"] : role === "teacher" ? ["all", "teachers"] : ["all", "students"];
  const list = await Announcement.find({ audience: { $in: aud } }).sort({ createdAt: -1 }).lean();
  res.json({ list });
});

export default router;
