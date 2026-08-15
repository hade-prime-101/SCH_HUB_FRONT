"use client";
import { useEffect, useState } from "react";
import { listUsers, assignRole, nominateCourseRep } from "@/lib/api/users.api";
import type { UserProfile } from "@/types/users";

export default function UsersListPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState("");
  const limit = 20;

  const refresh = () => {
    listUsers({ page, limit, role }).then(res => {
      setUsers(res.data);
      setTotal(res.total);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [page, role]);

  const handleAssignRole = async (userId: string, newRole: string) => {
    await assignRole({ userId, role: newRole });
    refresh();
  };

  const handleNominate = async (userId: string) => {
    await nominateCourseRep({ userId });
    alert("Nominated as course rep");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <div className="mb-4">
        <select value={role} onChange={e => setRole(e.target.value)} className="border p-2">
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="COURSE_REP">Course Rep</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <table className="w-full bg-card shadow rounded-lg">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2 text-right">
                <button onClick={() => handleNominate(u.id)} className="text-primary mr-2 hover:underline">Nominate CR</button>
                <select
                  className="border border-input bg-background p-1 rounded"
                  value={u.role}
                  onChange={e => handleAssignRole(u.id, e.target.value)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="COURSE_REP">Course Rep</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn">Prev</button>
        <span>Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="btn">Next</button>
      </div>
    </div>
  );
}