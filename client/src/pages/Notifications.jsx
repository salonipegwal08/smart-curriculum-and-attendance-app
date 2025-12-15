import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function Notifications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  useEffect(() => {
    setError("");
    setLoading(true);
    api.get("/notification").then((r)=>{
      setList(r.data.list||[]);
      setLoading(false);
    }).catch(()=>{
      setError("Failed to load notifications");
      setLoading(false);
    });
  }, []);
  async function mark(id) {
    await api.patch(`/notification/${id}/read`);
    setList((L)=>L.map((x)=> x._id===id ? { ...x, read: true } : x ));
  }
  function rel(t) {
    const d = new Date(t);
    const diff = Math.floor((Date.now() - d.getTime())/1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }
  const filtered = unreadOnly ? list.filter((n)=>!n.read) : list;
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Total {list.length}</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={unreadOnly} onChange={(e)=>setUnreadOnly(e.target.checked)} />
          Unread only
        </label>
      </div>
      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {!loading && error && <div className="text-sm text-red-600">{error}</div>}
      <ul className="space-y-2">
        {filtered.map((n)=>(
          <li key={n._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{n.title}</div>
                <span className={
                  n.type === "assignment" ? "text-xs px-2 py-1 rounded bg-blue-100 text-blue-700" :
                  n.type === "attendance" ? "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700" :
                  "text-xs px-2 py-1 rounded bg-purple-100 text-purple-700"
                }>{n.type}</span>
              </div>
              <div className="text-sm text-gray-600">{n.body}</div>
              <div className="text-xs text-gray-500 mt-1">{rel(n.createdAt)}</div>
            </div>
            <button className={`text-sm rounded px-3 py-2 border ${n.read?"bg-gray-100 text-gray-600":"bg-blue-600 text-white border-blue-600 hover:bg-blue-700"}`} disabled={n.read} onClick={()=>mark(n._id)}>
              {n.read ? "Read" : "Mark read"}
            </button>
          </li>
        ))}
        {!loading && filtered.length === 0 && (
          <li className="p-4 text-sm text-gray-500 bg-white rounded-xl shadow">No notifications</li>
        )}
      </ul>
      </div>
    </div>
  );
}
