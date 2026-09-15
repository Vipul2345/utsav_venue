'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Search, AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      const action = currentActive ? 'SUSPEND' : 'ACTIVATE';
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user status');
      }

      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">User Account Management</h1>
        <p className="text-xs text-stone-500">Manage customer and manager account privileges, roles, and status</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          placeholder="Search by user name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading user records...</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Primary Role</th>
                  <th className="p-4">Sub-Role / Details</th>
                  <th className="p-4">Activity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/50 transition">
                    <td className="p-4">
                      <p className="font-extrabold text-stone-900">{u.fullName}</p>
                      <p className="text-[11px] text-stone-500">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-900'
                            : u.role === 'MANAGER'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-stone-600">
                      {u.adminProfile?.adminRole || u.managerProfile?.businessName || 'Regular Customer'}
                    </td>
                    <td className="p-4 text-stone-600">
                      {u._count?.bookings || 0} Bookings | {u._count?.reviews || 0} Reviews
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(u.id, u.isActive)}
                          className={`px-3 py-1 font-bold rounded-xl transition ${
                            u.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
