import { useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";

export default function TeacherAttendance() {
  const [studentEmail, setStudentEmail] = useState("");
  const [klass, setKlass] = useState("");
  const [status, setStatus] = useState("present");
  const [message, setMessage] = useState("");
  const [daily, setDaily] = useState([]);
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trend, setTrend] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState("");
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [errorTrend, setErrorTrend] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0 };
    daily.forEach((r) => { s[r.status] = (s[r.status] || 0) + 1; });
    return s;
  }, [daily]);
  const filteredDaily = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return daily;
    return daily.filter((r) => {
      const n = (r.student?.name || "").toLowerCase();
      const e = (r.student?.email || "").toLowerCase();
      const s = (r.status || "").toLowerCase();
      return n.includes(q) || e.includes(q) || s.includes(q);
    });
  }, [daily, search]);

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      await api.post("/attendance/mark", { studentEmail, class: klass, status });
      setMessage("Marked successfully");
      loadDaily();
    } catch {
      setMessage("Error while marking");
    }
    setTimeout(() => setMessage(""), 2500);
    setSubmitting(false);
  }

  async function loadDaily() {
    if (!klass) return;
    const query = new URLSearchParams({ class: klass });
    if (date) query.set("date", date);
    setErrorDaily("");
    setLoadingDaily(true);
    try {
      const res = await api.get(`/attendance/daily?${query.toString()}`);
      setDaily(res.data.list || []);
    } catch {
      setErrorDaily("Failed to load daily attendance");
    }
    setLoadingDaily(false);
  }

  useEffect(() => { if (klass) loadDaily(); }, [klass]);

  useEffect(() => {
    api.get("/attendance/classes").then((res) => {
      setClasses(res.data.list || []);
      if (!klass && (res.data.list || []).length) {
        setKlass(res.data.list[0]);
      }
    }).catch(() => {});
  }, []);

  async function loadTrend() {
    if (!klass) return;
    const qs = new URLSearchParams();
    qs.set("class", klass);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    setErrorTrend("");
    setLoadingTrend(true);
    try {
      const res = await api.get(`/attendance/stats?${qs.toString()}`);
      setTrend(res.data.list || []);
    } catch {
      setErrorTrend("Failed to load trend data");
    }
    setLoadingTrend(false);
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Mark Attendance</h1>
      <form onSubmit={submit} className="max-w-md bg-white rounded-xl shadow p-4 space-y-3">
        <div>
          <label className="block text-sm">Student Email</label>
          <input className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Date</label>
          <input className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Class</label>
          {classes.length > 0 ? (
            <select className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={klass} onChange={(e) => setKlass(e.target.value)} required>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={klass} onChange={(e) => setKlass(e.target.value)} required />
          )}
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
        <button className="btn-primary disabled:opacity-50" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>
        {message && (
          <div className="text-sm mt-2">{message}</div>
        )}
      </form>

      {klass && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-3">
          <div className="font-medium">Today Summary ({klass})</div>
          <div className="flex items-center gap-4">
            <div className="w-full">
              <div className="text-xs">Present {summary.present}</div>
              <div className="h-2 bg-green-200 rounded" style={{ width: `${Math.min(100, summary.present * 10)}%` }}></div>
            </div>
            <div className="w-full">
              <div className="text-xs">Absent {summary.absent}</div>
              <div className="h-2 bg-red-200 rounded" style={{ width: `${Math.min(100, summary.absent * 10)}%` }}></div>
            </div>
            <div className="w-full">
              <div className="text-xs">Late {summary.late}</div>
              <div className="h-2 bg-yellow-200 rounded" style={{ width: `${Math.min(100, summary.late * 10)}%` }}></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mt-3">
              <input className="border rounded px-3 py-2 w-64" placeholder="Search name, email, status" value={search} onChange={(e)=>setSearch(e.target.value)} />
              {loadingDaily && <div className="text-sm text-gray-500">Loading...</div>}
              {!loadingDaily && errorDaily && <div className="text-sm text-red-600">{errorDaily}</div>}
            </div>
            <table className="table table-hover table-sm mt-2">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDaily.map((r) => (
                  <tr key={r._id}>
                    <td>{r.student?.name || "-"}</td>
                    <td>{r.student?.email || "-"}</td>
                    <td>
                      <span className={
                        r.status === "present" ? "chip-success capitalize" :
                        r.status === "absent" ? "chip-danger capitalize" :
                        "chip-warning capitalize"
                      }>{r.status}</span>
                    </td>
                  </tr>
                ))}
                {!loadingDaily && filteredDaily.length === 0 && (
                  <tr>
                    <td className="text-sm text-gray-500" colSpan={3}>No records</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-3">
        <div className="font-medium">Trend</div>
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm">From</label>
            <input type="date" className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={from} onChange={(e)=>setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">To</label>
            <input type="date" className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={to} onChange={(e)=>setTo(e.target.value)} />
          </div>
          <button className="self-end btn-primary" onClick={loadTrend}>Load</button>
          {loadingTrend && <div className="self-end text-sm text-gray-500">Loading...</div>}
          {!loadingTrend && errorTrend && <div className="self-end text-sm text-red-600">{errorTrend}</div>}
        </div>
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
      </div>
    </div>
  );
}
