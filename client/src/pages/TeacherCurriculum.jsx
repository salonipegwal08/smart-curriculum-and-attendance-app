import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function TeacherCurriculum() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  async function load() {
    const res = await api.get(`/curriculum?owner=${user?.id}`);
    setList(res.data.list || []);
  }
  useEffect(() => { if (user) load(); }, []);

  async function create() {
    if (!title) return;
    await api.post("/curriculum", { title, modules: [] });
    setTitle("");
    load();
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Curriculum</h1>
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn-primary" onClick={create}>Create</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((c) => (
          <div key={c._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-gray-600">Modules: {c.modules?.length || 0}</div>
            <Editor doc={c} onChange={load} />
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-sm text-gray-500">No curriculum found</div>
        )}
      </div>
      </div>
    </div>
  );
}

function Editor({ doc, onChange }) {
  const [mTitle, setMTitle] = useState("");
  const [uTitle, setUTitle] = useState("");
  const [lTitle, setLTitle] = useState("");
  const [mIdx, setMIdx] = useState(0);
  const [uIdx, setUIdx] = useState(0);
  const modules = doc.modules || [];

  async function addModule() {
    if (!mTitle) return;
    await api.post(`/curriculum/${doc._id}/modules`, { title: mTitle });
    setMTitle("");
    onChange();
  }
  async function addUnit() {
    await api.post(`/curriculum/${doc._id}/modules/${mIdx}/units`, { title: uTitle });
    setUTitle("");
    onChange();
  }
  async function addLesson() {
    await api.post(`/curriculum/${doc._id}/modules/${mIdx}/units/${uIdx}/lessons`, { title: lTitle });
    setLTitle("");
    onChange();
  }

  async function setLessonProgress(m, u, l, payload) {
    await api.patch(`/curriculum/${doc._id}/lesson`, {
      moduleIndex: m,
      unitIndex: u,
      lessonIndex: l,
      ...payload
    });
    onChange();
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1" placeholder="New module title" value={mTitle} onChange={(e)=>setMTitle(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-2 py-1" onClick={addModule}>Add module</button>
      </div>
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 w-16" type="number" min="0" value={mIdx} onChange={(e)=>setMIdx(Number(e.target.value))} />
        <input className="border rounded px-2 py-1" placeholder="New unit title" value={uTitle} onChange={(e)=>setUTitle(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-2 py-1" onClick={addUnit}>Add unit</button>
      </div>
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 w-16" type="number" min="0" value={mIdx} onChange={(e)=>setMIdx(Number(e.target.value))} />
        <input className="border rounded px-2 py-1 w-16" type="number" min="0" value={uIdx} onChange={(e)=>setUIdx(Number(e.target.value))} />
        <input className="border rounded px-2 py-1" placeholder="New lesson title" value={lTitle} onChange={(e)=>setLTitle(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-2 py-1" onClick={addLesson}>Add lesson</button>
      </div>

      <div className="mt-4">
        <div className="font-medium">Modules</div>
        <ul className="space-y-2">
          {modules.map((m, mi) => (
            <li key={mi} className="border rounded p-2">
              <div className="font-medium">{m.title}</div>
              <ul className="mt-2 space-y-2">
                {(m.units||[]).map((u, ui) => (
                  <li key={ui} className="border rounded p-2">
                    <div className="font-medium">{u.title}</div>
                    <ul className="mt-2 space-y-2">
                      {(u.lessons||[]).map((l, li) => (
                        <li key={li} className="border rounded p-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{l.title}</div>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={!!l.completed} onChange={(e)=>setLessonProgress(mi, ui, li, { completed: e.target.checked })} />
                              Completed
                            </label>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs">Progress</label>
                            <input type="range" min="0" max="100" value={l.progress||0} onChange={(e)=>setLessonProgress(mi, ui, li, { progress: Number(e.target.value) })} />
                            <span className="text-xs">{l.progress||0}%</span>
                          </div>
                        </li>
                      ))}
                      {(u.lessons||[]).length === 0 && (
                        <li className="text-xs text-gray-500">No lessons</li>
                      )}
                    </ul>
                  </li>
                ))}
                {(m.units||[]).length === 0 && (
                  <li className="text-xs text-gray-500">No units</li>
                )}
              </ul>
            </li>
          ))}
          {modules.length === 0 && (
            <li className="text-sm text-gray-500">No modules</li>
          )}
        </ul>
      </div>
    </div>
  );
}
