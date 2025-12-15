import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import TeacherAttendance from "./pages/TeacherAttendance.jsx";
import StudentAttendance from "./pages/StudentAttendance.jsx";
import TeacherCurriculum from "./pages/TeacherCurriculum.jsx";
import TeacherActivities from "./pages/TeacherActivities.jsx";
import StudentActivities from "./pages/StudentActivities.jsx";
import Notifications from "./pages/Notifications.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";

function RequireAuth({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/dashboard/${user.role}`} replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")||"null");
  function toggleTheme() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }
  useEffect(() => {
    const t = localStorage.getItem("theme");
    if (t === "dark") document.documentElement.classList.add("dark");
  }, []);
  return (
    <div className="min-h-screen bg-brand-50 dark:bg-gray-900 dark:text-gray-100">
      <header className="px-4 py-3 border-b bg-gradient-to-r from-brand-600 to-brand-700 text-white dark:bg-gray-800 dark:text-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={user ? `/dashboard/${user.role}` : "/login"} className="font-semibold text-lg">Smart Curriculum</Link>
            {user && (
              <nav className="hidden md:flex items-center gap-3 text-sm">
                {user.role === "teacher" && (
                  <>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/teacher/attendance">Attendance</Link>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/teacher/activities">Assignments</Link>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/teacher/curriculum">Curriculum</Link>
                  </>
                )}
                {user.role === "student" && (
                  <>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/student/attendance">Attendance</Link>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/student/activities">Assignments</Link>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/dashboard/admin">Dashboard</Link>
                    <Link className="border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/admin/users">Users</Link>
                  </>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link className="text-sm border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" to="/notifications">Notifications</Link>
            <button className="text-sm border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" onClick={toggleTheme}>Change theme</button>
            {user && (
              <button className="text-sm border border-white/50 rounded px-2 py-1 text-white hover:bg-white/10" onClick={logout}>Logout</button>
            )}
          </div>
        </div>
      </header>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard/admin"
        element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>}
      />
      <Route
        path="/admin/users"
        element={<RequireAuth role="admin"><AdminUsers /></RequireAuth>}
      />
      <Route
        path="/dashboard/teacher"
        element={<RequireAuth role="teacher"><TeacherDashboard /></RequireAuth>}
      />
      <Route
        path="/teacher/attendance"
        element={<RequireAuth role="teacher"><TeacherAttendance /></RequireAuth>}
      />
      <Route
        path="/teacher/curriculum"
        element={<RequireAuth role="teacher"><TeacherCurriculum /></RequireAuth>}
      />
      <Route
        path="/teacher/activities"
        element={<RequireAuth role="teacher"><TeacherActivities /></RequireAuth>}
      />
      <Route
        path="/dashboard/student"
        element={<RequireAuth role="student"><StudentDashboard /></RequireAuth>}
      />
      <Route
        path="/student/attendance"
        element={<RequireAuth role="student"><StudentAttendance /></RequireAuth>}
      />
      <Route
        path="/student/activities"
        element={<RequireAuth role="student"><StudentActivities /></RequireAuth>}
      />
      <Route
        path="/notifications"
        element={<RequireAuth><Notifications /></RequireAuth>}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </div>
  );
}
