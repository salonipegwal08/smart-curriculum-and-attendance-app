import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function TeacherActivities() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [email, setEmail] = useState("");
  const [due, setDue] = useState("");
  const [list, setList] = useState([]);
  const [grading, setGrading] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/activity/mine");
      setList(res.data.list || []);
    } catch {
      setError("Failed to load activities");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!title || !email) return;
    const assignedEmails = email.split(",").map((e)=>e.trim()).filter(Boolean);
    const payload = { title, description: desc, assignedEmails };
    if (due) payload.dueDate = due;
    await api.post("/activity", payload);
    setTitle(""); setDesc(""); setEmail(""); setDue("");
    load();
  }

  async function remove(id) {
    await api.delete(`/activity/${id}`);
    setList((L) => L.filter((a) => a._id !== id));
  }

  async function submitGrade(activityId, studentId) {
    const g = grading[`${activityId}:${studentId}`] || {};
    const gradeNum = Number(g.grade);
    if (!studentId || Number.isNaN(gradeNum)) return;
    await api.patch(`/activity/${activityId}/grade`, { studentId, grade: gradeNum, feedback: g.feedback || "" });
    load();
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Activities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-2">
          <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Student emails (comma-separated)" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={desc} onChange={(e)=>setDesc(e.target.value)} />
          <div>
            <label className="block text-sm">Due date</label>
            <input className="w-full border rounded px-3 py-2" type="date" value={due} onChange={(e)=>setDue(e.target.value)} />
          </div>
          <button className="bg-blue-600 text-white rounded px-3 py-2" onClick={create}>Create</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="font-medium mb-2">Created</div>
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {!loading && error && <div className="text-sm text-red-600">{error}</div>}
          <ul className="space-y-2">
            {list.map((a) => (
              <li key={a._id} className="border rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.title}</div>
                  <button className="text-sm border rounded px-2 py-1 hover:bg-red-50 text-red-700 border-red-600" onClick={()=>remove(a._id)}>Delete</button>
                </div>
                <div className="text-sm text-gray-600">Assigned: {a.assignedTo?.length || 0}</div>
                <div className="text-xs text-gray-500">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}</div>
                <div className="mt-2">
                  <div className="text-sm font-medium">Submissions</div>
                  <ul className="space-y-2">
                    {(a.submissions || []).length === 0 && (
                      <li className="text-sm text-gray-500">No submissions yet</li>
                    )}
                    {(a.submissions || []).map((s) => (
                      <li key={s.student?._id || s.student} className="border rounded p-2">
                        <div className="text-sm">{s.student?.name || s.student} ({s.student?.email || ""})</div>
                        <a className="text-sm text-blue-600" href={s.url} target="_blank" rel="noreferrer">Submission URL</a>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                          <div>
                            <label className="block text-xs">Grade</label>
                            <input className="border rounded px-2 py-1 w-full" type="number" value={(grading[`${a._id}:${s.student?._id || s.student}`]?.grade) || ""}
                              onChange={(e)=>setGrading((G)=>({ ...G, [`${a._id}:${s.student?._id || s.student}`]: { ...(G[`${a._id}:${s.student?._id || s.student}`]||{}), grade: e.target.value } }))} />
                          </div>
                          <div>
                            <label className="block text-xs">Feedback</label>
                            <input className="border rounded px-2 py-1 w-full" value={(grading[`${a._id}:${s.student?._id || s.student}`]?.feedback) || ""}
                              onChange={(e)=>setGrading((G)=>({ ...G, [`${a._id}:${s.student?._id || s.student}`]: { ...(G[`${a._id}:${s.student?._id || s.student}`]||{}), feedback: e.target.value } }))} />
                          </div>
                          <button className="bg-green-600 text-white rounded px-3 py-2" onClick={()=>submitGrade(a._id, s.student?._id || s.student)}>Save</button>
                        </div>
                        {typeof s.grade === "number" && (
                          <div className="mt-1 text-xs text-gray-600">Current grade: {s.grade}{s.feedback ? ` — ${s.feedback}` : ""}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
            {!loading && list.length === 0 && (
              <li className="text-sm text-gray-500">No activities</li>
            )}
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
