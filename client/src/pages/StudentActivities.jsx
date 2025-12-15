import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function StudentActivities() {
  const [list, setList] = useState([]);
  const [submitting, setSubmitting] = useState({});
  const [urls, setUrls] = useState({});
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get("/activity/assigned").then((res) => {
      const L = res.data.list || [];
      setList(L);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const init = {};
      L.forEach((a) => {
        const mine = (a.submissions || []).find((s) => String(s.student) === String(user?.id));
        if (mine?.url) init[a._id] = mine.url;
      });
      setUrls(init);
    });
  }, []);

  async function submit(id) {
    setSubmitting((s) => ({ ...s, [id]: true }));
    try {
      const url = urls[id] || "";
      if (!url) return;
      await api.post(`/activity/${id}/submit`, { url });
      const res = await api.get("/activity/assigned");
      setList(res.data.list || []);
    } finally {
      setSubmitting((s) => ({ ...s, [id]: false }));
    }
  }

  async function uploadFile(id) {
    const file = files[id];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (!allowed.includes(file.type)) {
      setErrors((E)=>({ ...E, [id]: "Unsupported file type" }));
      return;
    }
    if (file.size > 20*1024*1024) {
      setErrors((E)=>({ ...E, [id]: "File too large (max 20MB)" }));
      return;
    }
    setUploading((u) => ({ ...u, [id]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/activity/${id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const res = await api.get("/activity/assigned");
      setList(res.data.list || []);
      setErrors((E)=>({ ...E, [id]: "" }));
    } finally {
      setUploading((u) => ({ ...u, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Activities</h1>
      <ul className="space-y-2">
        {list.map((a) => {
          const user = JSON.parse(localStorage.getItem("user") || "null");
          const mine = (a.submissions || []).find((s) => String(s.student) === String(user?.id));
          return (
            <li key={a._id} className="bg-white rounded-xl shadow p-4">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <input className="border rounded px-3 py-2" placeholder="Submission URL" value={urls[a._id] || ""} onChange={(e)=>setUrls((U)=>({ ...U, [a._id]: e.target.value }))} />
                <button className="btn-primary disabled:opacity-50" disabled={!!submitting[a._id]} onClick={() => submit(a._id)}>
                  {submitting[a._id] ? "Submitting..." : (mine?.url ? "Update URL" : "Submit URL")}
                </button>
                {mine?.grade !== undefined && (
                  <div className="text-sm text-gray-700">Grade: {mine.grade}{mine.feedback ? ` — ${mine.feedback}` : ""}</div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <input className="border rounded px-3 py-2" type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg,.zip" onChange={(e)=>setFiles((F)=>({ ...F, [a._id]: e.target.files?.[0] }))} />
                <button className="btn-primary disabled:opacity-50" disabled={!!uploading[a._id]} onClick={() => uploadFile(a._id)}>
                  {uploading[a._id] ? "Uploading..." : "Upload File"}
                </button>
                {mine?.url && (
                  <a className="text-sm text-blue-600" href={mine.url} target="_blank" rel="noreferrer">View current submission</a>
                )}
                {errors[a._id] && (
                  <div className="text-sm text-red-600">{errors[a._id]}</div>
                )}
              </div>
              {mine?.url && (
                <a className="mt-1 inline-block text-sm text-blue-600" href={mine.url} target="_blank" rel="noreferrer">View current submission</a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
