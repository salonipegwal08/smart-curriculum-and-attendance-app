import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/", auth, requireRole("admin"), async (req, res) => {
  const list = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  res.json({ list });
});

router.patch("/:id/role", auth, requireRole("admin"), async (req, res) => {
  const { role } = req.body || {};
  if (!role || !["admin", "teacher", "student"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  await User.findByIdAndUpdate(req.params.id, { role });
  res.json({ ok: true });
});

router.post("/create", auth, requireRole("admin"), async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ error: "Missing fields" });
  try {
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ error: "Email in use" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, role, passwordHash });
    res.status(201).json({ id: user._id });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
