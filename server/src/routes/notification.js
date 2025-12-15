import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import Notification from "../models/Notification.js";

const router = Router();

router.post("/", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { title, body, type = "announcement", userId } = req.body || {};
  if (!title || !userId) return res.status(400).json({ error: "Missing fields" });
  try {
    const doc = await Notification.create({ title, body, type, user: userId, createdBy: req.user.id });
    res.status(201).json({ id: doc._id });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  const list = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ list });
});

router.patch("/:id/read", auth, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true });
  res.json({ ok: true });
});

export default router;
