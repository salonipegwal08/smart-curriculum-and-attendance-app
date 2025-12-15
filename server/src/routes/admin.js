import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Activity from "../models/Activity.js";

const router = Router();

router.get("/analytics", auth, requireRole("admin"), async (req, res) => {
  const [admins, teachers, students] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "student" })
  ]);

  const today = new Date(new Date().toDateString());
  const attToday = await Attendance.aggregate([
    { $match: { date: today } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const activitiesTotal = await Activity.countDocuments();
  const submissionsTotal = await Activity.aggregate([
    { $unwind: { path: "$submissions", preserveNullAndEmptyArrays: true } },
    { $group: { _id: null, count: { $sum: { $cond: [ { $ifNull: ["$submissions", false] }, 1, 0 ] } } } }
  ]);

  res.json({
    users: { admins, teachers, students },
    attendanceToday: attToday.reduce((acc, it) => { acc[it._id] = it.count; return acc; }, {}),
    activities: { total: activitiesTotal, submissions: submissionsTotal[0]?.count || 0 }
  });
});

export default router;
