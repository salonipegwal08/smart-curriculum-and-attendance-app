import { Router } from "express";
import Curriculum from "../models/Curriculum.js";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.post("/", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { title, modules } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing title" });
  try {
    const doc = await Curriculum.create({ title, modules: modules || [], owner: req.user.id });
    res.status(201).json({ id: doc._id });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  const { owner } = req.query || {};
  const q = owner ? { owner } : {};
  const list = await Curriculum.find(q).lean();
  res.json({ list });
});

router.get("/:id", auth, async (req, res) => {
  const doc = await Curriculum.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ doc });
});

router.patch("/:id/lesson", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { moduleIndex, unitIndex, lessonIndex, completed, progress } = req.body || {};
  if ([moduleIndex, unitIndex, lessonIndex].some((v) => typeof v !== "number")) {
    return res.status(400).json({ error: "Invalid indices" });
  }
  try {
    const doc = await Curriculum.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    const lesson = doc.modules?.[moduleIndex]?.units?.[unitIndex]?.lessons?.[lessonIndex];
    if (!lesson) return res.status(400).json({ error: "Lesson not found" });
    if (typeof completed === "boolean") lesson.completed = completed;
    if (typeof progress === "number") lesson.progress = progress;
    await doc.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/modules", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing title" });
  try {
    const doc = await Curriculum.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    doc.modules = doc.modules || [];
    doc.modules.push({ title, units: [] });
    await doc.save();
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/modules/:m/units", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { title } = req.body || {};
  const m = Number(req.params.m);
  if (!title || Number.isNaN(m)) return res.status(400).json({ error: "Invalid payload" });
  try {
    const doc = await Curriculum.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    const mod = doc.modules?.[m];
    if (!mod) return res.status(400).json({ error: "Module not found" });
    mod.units = mod.units || [];
    mod.units.push({ title, lessons: [] });
    await doc.save();
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/modules/:m/units/:u/lessons", auth, requireRole("teacher", "admin"), async (req, res) => {
  const { title } = req.body || {};
  const m = Number(req.params.m);
  const u = Number(req.params.u);
  if (!title || Number.isNaN(m) || Number.isNaN(u)) return res.status(400).json({ error: "Invalid payload" });
  try {
    const doc = await Curriculum.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    const unit = doc.modules?.[m]?.units?.[u];
    if (!unit) return res.status(400).json({ error: "Unit not found" });
    unit.lessons = unit.lessons || [];
    unit.lessons.push({ title, completed: false, progress: 0 });
    await doc.save();
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
