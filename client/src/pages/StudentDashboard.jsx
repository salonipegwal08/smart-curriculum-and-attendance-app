import Card from "../components/Card.jsx";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function StudentDashboard() {
  const [ann, setAnn] = useState([]);
  const [percent, setPercent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upcoming, setUpcoming] = useState([]);
  const [streak, setStreak] = useState(0);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get("/announcement").then((r)=>setAnn(r.data.list||[]));
    const user = JSON.parse(localStorage.getItem("user")||"null");
    if (!user) return;
    const to = new Date();
    const from = new Date(Date.now() - 30*24*60*60*1000);
    const qs = new URLSearchParams({ from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) });
    setLoading(true); setError("");
    api.get(`/attendance/history/${user.id}?${qs.toString()}`).then((res)=>{
      const L = res.data.list||[];
      const present = L.filter((r)=>r.status === "present").length;
      const total = L.length || 1;
      setPercent(Math.round((present/total)*100));
      let s = 0;
      for (const r of L) { if (r.status === "present") s++; else break; }
      setStreak(s);
      const t = L.slice(0,14).reverse();
      setTrend(t);
      setLoading(false);
    }).catch(()=>{ setError("Failed to load attendance"); setLoading(false); });
    api.get("/activity/assigned").then((res)=>{
      const list = res.data.list||[];
      const now = Date.now();
      list.sort((a,b)=> new Date(a.dueDate||0) - new Date(b.dueDate||0));
      const top = list.filter((a)=>!a.dueDate || new Date(a.dueDate).getTime() >= now).slice(0,5);
      setUpcoming(top);
      const userId = user?.id;
      const subs = [];
      list.forEach((a)=>{
        const mine = (a.submissions||[]).find((s)=> String(s.student) === String(userId));
        if (mine?.url) subs.push({ title: a.title, url: mine.url, submittedAt: mine.submittedAt, grade: mine.grade, feedback: mine.feedback });
      });
      subs.sort((x,y)=> new Date(y.submittedAt||0) - new Date(x.submittedAt||0));
      setRecent(subs.slice(0,3));
    }).catch(()=>{});
  }, []);
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Assignments">
          <div className="text-sm text-gray-600 mb-2">Submit and view feedback</div>
          <Link className="btn-primary" to="/student/activities">Open</Link>
        </Card>
        <Card title="Attendance">
          <Link className="btn-primary" to="/student/attendance">Open</Link>
        </Card>
        <Card title="Attendance %">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {!loading && error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && percent !== null && (
            <div className="text-3xl font-semibold">{percent}%</div>
          )}
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="font-medium mb-2">Attendance Streak & Trend</div>
          <div className="text-sm">Current streak: {streak} days</div>
          <div className="mt-2 overflow-x-auto">
            <svg width={trend.length * 28} height={60}>
              {trend.map((r, i) => {
                const x = i * 28 + 12;
                const fill = r.status === "present" ? "#16a34a" : r.status === "absent" ? "#dc2626" : "#facc15";
                return (
                  <g key={i}>
                    <rect x={x} y={20} width={16} height={16} rx={4} fill={fill} />
                    <text x={x} y={50} fontSize={9}>{new Date(r.date).toLocaleDateString()}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="font-medium mb-2">My Recent Submissions</div>
          <ul className="space-y-2">
            {recent.map((s, i) => (
              <li key={i} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-gray-600">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "N/A"}</div>
                </div>
                <div className="text-right">
                  {typeof s.grade === "number" ? (
                    <div className="text-xs">Grade: {s.grade}{s.feedback ? ` — ${s.feedback}` : ""}</div>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Submitted</span>
                  )}
                </div>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="text-sm text-gray-500">No submissions yet</li>
            )}
          </ul>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="font-medium mb-2">Upcoming Assignments</div>
        <ul className="space-y-2">
          {upcoming.map((a)=>{
            const user = JSON.parse(localStorage.getItem("user")||"null");
            const mine = (a.submissions||[]).find((s)=> String(s.student) === String(user?.id));
            const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A";
            return (
              <li key={a._id} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-600">Due: {due}</div>
                </div>
                <div>
                  <span className={mine?.url ? "text-xs px-2 py-1 rounded bg-green-100 text-green-700" : "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700"}>
                    {mine?.url ? "Submitted" : "Pending"}
                  </span>
                </div>
              </li>
            );
          })}
          {upcoming.length === 0 && (
            <li className="text-sm text-gray-500">No upcoming assignments</li>
          )}
        </ul>
        <div className="mt-3">
          <Link className="inline-block bg-blue-600 text-white rounded px-3 py-2" to="/student/activities">View all assignments</Link>
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
