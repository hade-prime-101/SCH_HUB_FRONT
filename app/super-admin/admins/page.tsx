"use client";
import { useEffect, useState } from "react";
import {
  listAdmins, createAdmin, deleteAdmin, deactivateAdmin, reactivateAdmin, resetAdminPassword
} from "@/lib/api/super-admin.api";
import type { AdminUser, CreateAdminPayload } from "@/types/super-admin";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAdminPayload>({ name: "", email: "", password: "", schoolId: "", role: "SCHOOL_ADMIN" });
  const [resetPassId, setResetPassId] = useState<string | null>(null);

  const refresh = () => listAdmins().then(setAdmins);
  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    await createAdmin(form);
    setShowForm(false);
    setForm({ name: "", email: "", password: "", schoolId: "", role: "SCHOOL_ADMIN" });
    refresh();
  };

  const handleToggleActive = async (admin: AdminUser) => {
    if (admin.isActive) {
      await deactivateAdmin(admin.id);
    } else {
      await reactivateAdmin(admin.id);
    }
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete admin?")) {
      await deleteAdmin(id);
      refresh();
    }
  };

  const handleResetPassword = async (id: string, password: string) => {
    await resetAdminPassword(id, { password });
    setResetPassId(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Admins</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Add Admin</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">New Admin</h2>
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="School ID (optional)" value={form.schoolId} onChange={e => setForm({...form, schoolId: e.target.value})} className="border p-2 w-full mb-2" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 w-full mb-4">
              <option value="SCHOOL_ADMIN">School Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
            </div>
          </div>
        </div>
      )}

      {resetPassId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="font-semibold mb-2">Reset Password</h2>
            <input type="password" id="newpass" placeholder="New Password" className="border p-2 w-full" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setResetPassId(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button onClick={() => handleResetPassword(resetPassId, (document.getElementById('newpass') as HTMLInputElement).value)} className="bg-blue-600 text-white px-4 py-2 rounded">Reset</button>
            </div>
          </div>
        </div>
      )}

      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Active</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id} className="border-t">
              <td className="p-2">{admin.name}</td>
              <td className="p-2">{admin.email}</td>
              <td className="p-2">{admin.role}</td>
              <td className="p-2">{admin.isActive ? 'Yes' : 'No'}</td>
              <td className="p-2 text-right">
                <button onClick={() => handleToggleActive(admin)} className="text-blue-600 mr-2">
                  {admin.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
                <button onClick={() => setResetPassId(admin.id)} className="text-orange-600 mr-2">Reset PW</button>
                <button onClick={() => handleDelete(admin.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}