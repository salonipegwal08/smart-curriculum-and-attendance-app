import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher" });

  async function load() {
    const res = await api.get("/users");
    setList(res.data.list || []);
  }
  useEffect(() => { load(); }, []);

  async function updateRole(id, role) {
    await api.patch(`/users/${id}/role`, { role });
    setList((L)=>L.map((u)=> u._id===id ? { ...u, role } : u));
  }

  async function createUser() {
    const { name, email, password, role } = form;
    if (!name || !email || !password) return;
    await api.post("/users/create", { name, email, password, role });
    setForm({ name: "", email: "", password: "", role: "teacher" });
    load();
  }

  async function remove(id) {
    await api.delete(`/users/${id}`);
    setList((L)=>L.filter((u)=>u._id!==id));
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">User Management</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-2">
        <div className="font-medium">Create User</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Email" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} />
          <input className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({ ...form, password: e.target.value })} />
          <select className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" value={form.role} onChange={(e)=>setForm({ ...form, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <button className="btn-primary" onClick={createUser}>Create</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="p-2 bg-gray-50">Name</th>
              <th className="p-2 bg-gray-50">Email</th>
              <th className="p-2 bg-gray-50">Role</th>
              <th className="p-2 bg-gray-50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500" value={u.role} onChange={(e)=>updateRole(u._id, e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </td>
                <td className="p-2">
                  <button className="text-sm border rounded px-2 py-1 hover:bg-red-50" onClick={()=>remove(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
