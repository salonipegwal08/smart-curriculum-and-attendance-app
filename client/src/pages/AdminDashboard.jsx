import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import api from "../lib/api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: {}, attendanceToday: {}, activities: {} });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [list, setList] = useState([]);

  async function load() {
    try {
      const s = await api.get("/admin/analytics");
      setStats(s.data);
      const a = await api.get("/announcement");
      setList(a.data.list || []);
    } catch {}
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!title) return;
    await api.post("/announcement", { title, body, audience: "all" });
    setTitle(""); setBody("");
    load();
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Users">
          <div className="text-sm">Admins: {stats.users.admins || 0}</div>
          <div className="text-sm">Teachers: {stats.users.teachers || 0}</div>
          <div className="text-sm">Students: {stats.users.students || 0}</div>
          <a href="/admin/users" className="btn-primary mt-2 text-sm">Manage</a>
        </Card>
        <Card title="Attendance Today">
          <div className="text-sm">Present: {stats.attendanceToday.present || 0}</div>
          <div className="text-sm">Absent: {stats.attendanceToday.absent || 0}</div>
          <div className="text-sm">Late: {stats.attendanceToday.late || 0}</div>
        </Card>
        <Card title="Activities">
          <div className="text-sm">Total: {stats.activities.total || 0}</div>
          <div className="text-sm">Submissions: {stats.activities.submissions || 0}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-2">
          <div className="font-medium">Create Announcement</div>
          <input className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <textarea className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Body" value={body} onChange={(e)=>setBody(e.target.value)} />
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2" onClick={create}>Publish</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="font-medium mb-2">Announcements</div>
          <ul className="space-y-2">
            {list.map((x) => (
              <li key={x._id} className="border rounded p-2">
                <div className="font-medium">{x.title}</div>
                <div className="text-sm text-gray-600">{x.body}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
