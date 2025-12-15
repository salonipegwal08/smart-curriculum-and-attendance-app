import { useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";

export default function StudentAttendance() {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0 };
    rows.forEach((r) => { s[r.status] = (s[r.status] || 0) + 1; });
    return s;
  }, [rows]);
  async function load() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return;
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    setError("");
    setLoading(true);
    try {
      const res = await api.get(`/attendance/history/${user.id}?${qs.toString()}`);
      setRows(res.data.list || []);
    } catch {
      setError("Failed to load attendance history");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [from, to]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const d = new Date(r.date).toLocaleDateString();
      const cls = (r.class || "").toLowerCase();
      const s = (r.status || "").toLowerCase();
      const byQ = !q || d.toLowerCase().includes(q) || cls.includes(q) || s.includes(q);
      const byStatus = !statusFilter || s === statusFilter;
      return byQ && byStatus;
    });
  }, [rows, search, statusFilter]);
  function exportCSV() {
    const header = ["Date", "Class", "Status"]; 
    const lines = filtered.map((r) => [new Date(r.date).toLocaleDateString(), r.class, r.status]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Attendance History</h1>
      <div className="flex gap-2">
        <div>
          <label className="block text-sm">From</label>
          <input type="date" className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={from} onChange={(e)=>setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">To</label>
          <input type="date" className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={to} onChange={(e)=>setTo(e.target.value)} />
        </div>
        <button className="self-end btn-primary" onClick={load}>Refresh</button>
        <div className="flex-1"></div>
        <input className="self-end border rounded px-3 py-2 w-64" placeholder="Search date, class, status" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <div className="self-end flex gap-2">
          <button className={`px-3 py-2 rounded text-sm border ${statusFilter===""?"bg-gray-100":""}`} onClick={()=>setStatusFilter("")}>All</button>
          <button className={`px-3 py-2 rounded text-sm border ${statusFilter==="present"?"bg-green-100":""}`} onClick={()=>setStatusFilter("present")}>Present</button>
          <button className={`px-3 py-2 rounded text-sm border ${statusFilter==="absent"?"bg-red-100":""}`} onClick={()=>setStatusFilter("absent")}>Absent</button>
          <button className={`px-3 py-2 rounded text-sm border ${statusFilter==="late"?"bg-yellow-100":""}`} onClick={()=>setStatusFilter("late")}>Late</button>
        </div>
        <button className="self-end bg-gray-700 hover:bg-gray-800 text-white rounded px-3 py-2" onClick={exportCSV}>Export CSV</button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="font-medium">Summary</div>
        <div className="flex items-center gap-4">
          <div className="w-full">
            <div className="text-xs">Present {summary.present}</div>
            <div className="h-2 bg-green-200 rounded" style={{ width: `${Math.min(100, summary.present * 5)}%` }}></div>
          </div>
          <div className="w-full">
            <div className="text-xs">Absent {summary.absent}</div>
            <div className="h-2 bg-red-200 rounded" style={{ width: `${Math.min(100, summary.absent * 5)}%` }}></div>
          </div>
          <div className="w-full">
            <div className="text-xs">Late {summary.late}</div>
            <div className="h-2 bg-yellow-200 rounded" style={{ width: `${Math.min(100, summary.late * 5)}%` }}></div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        {loading && <div className="p-4 text-sm text-gray-500">Loading...</div>}
        {!loading && error && <div className="p-4 text-sm text-red-600">{error}</div>}
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.class}</td>
                <td>
                  <span className={
                    r.status === "present" ? "chip-success capitalize" :
                    r.status === "absent" ? "chip-danger capitalize" :
                    "chip-warning capitalize"
                  }>{r.status}</span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="text-sm text-gray-500" colSpan={3}>No records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
