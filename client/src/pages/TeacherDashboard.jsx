import Card from "../components/Card.jsx";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function TeacherDashboard() {
  const [ann, setAnn] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    api.get("/announcement").then((r)=>setAnn(r.data.list||[]));
    const to = new Date();
    const from = new Date(Date.now() - 6*24*60*60*1000);
    const qs = new URLSearchParams({ from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) });
    setLoading(true); setError("");
    Promise.all([
      api.get(`/attendance/stats?${qs.toString()}`),
      api.get("/activity/mine")
    ]).then(([statsRes, actRes]) => {
      setTrend(statsRes.data.list||[]);
      setActivities(actRes.data.list||[]);
      setLoading(false);
    }).catch(()=>{ setError("Failed to load stats"); setLoading(false); });
  }, []);
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Attendance">
          <div className="text-sm text-gray-600 mb-2">Class marking, reports</div>
          <Link className="btn-primary" to="/teacher/attendance">Open</Link>
        </Card>
        <Card title="Assignments">
          <div className="text-sm text-gray-600 mb-2">Created: {activities.length}</div>
          <Link className="btn-primary" to="/teacher/activities">Open</Link>
        </Card>
        <Card title="Curriculum">
          <div className="text-sm text-gray-600 mb-2">Manage syllabus</div>
          <Link className="btn-primary" to="/teacher/curriculum">Open</Link>
        </Card>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="font-medium mb-2">Attendance — last 7 days</div>
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {!loading && error && <div className="text-sm text-red-600">{error}</div>}
        <div className="overflow-x-auto">
          <svg width={trend.length * 60} height={120}>
            {trend.map((d, i) => {
              const p = d.counts?.present || 0;
              const a = d.counts?.absent || 0;
              const l = d.counts?.late || 0;
              const x = i * 60 + 20;
              const scale = 10;
              return (
                <g key={i}>
                  <rect x={x} y={100 - p * scale} width={12} height={p * scale} fill="#16a34a" />
                  <rect x={x + 14} y={100 - a * scale} width={12} height={a * scale} fill="#dc2626" />
                  <rect x={x + 28} y={100 - l * scale} width={12} height={l * scale} fill="#facc15" />
                  <text x={x} y={115} fontSize={10}>{new Date(d.date).toLocaleDateString()}</text>
                </g>
              );
            })}
          </svg>
          {trend.length > 0 && (
            <div className="flex gap-4 mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-green-600"></span> Present</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-600"></span> Absent</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-yellow-400"></span> Late</div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="font-medium mb-2">Announcements</div>
        <ul className="space-y-2">
          {ann.map((x) => (
            <li key={x._id} className="border rounded p-2">
              <div className="font-medium">{x.title}</div>
              <div className="text-sm text-gray-600">{x.body}</div>
            </li>
          ))}
          {ann.length === 0 && (
            <li className="text-sm text-gray-500">No announcements</li>
          )}
        </ul>
      </div>
      </div>
    </div>
  );
}
