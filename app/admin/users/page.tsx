'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  Search,
  AlertCircle,
  Plus,
  CheckCircle2,
  X,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'USERS' | 'ADMINS'>('USERS');

  // Modal State
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState('OPERATIONS_ADMIN');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const addAdminRef = useRef<HTMLDivElement>(null);
  useModalDismiss(addAdminRef, () => setAddAdminModalOpen(false), addAdminModalOpen);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, adminsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/admins'),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
      if (adminsRes.ok) {
        const aData = await adminsRes.json();
        setAdmins(aData.admins || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSavingAdmin(true);

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: adminName.trim(),
          email: adminEmail.trim(),
          phone: adminPhone.trim() || undefined,
          password: adminPassword,
          adminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create administrator');
      }

      setSuccessMsg(`Administrator '${adminName}' created successfully!`);
      setAdminName('');
      setAdminEmail('');
      setAdminPhone('');
      setAdminPassword('');
      setAddAdminModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSavingAdmin(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const filteredAdmins = admins.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.adminProfile?.adminRole || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            User & Administrator Management
          </h1>
          <p className="text-xs text-stone-500">
            Oversee user accounts, privileges, security status, and platform administrator roles
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setAddAdminModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Create Administrator
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 justify-center ${
              activeTab === 'USERS'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-stone-600" />
            <span>All Users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ADMINS')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 justify-center ${
              activeTab === 'ADMINS'
                ? 'bg-white text-purple-950 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Administrators ({admins.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder={activeTab === 'USERS' ? 'Search users by name or email...' : 'Search admins by name or role...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading records...</div>
      ) : activeTab === 'USERS' ? (
        /* Users Table */
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Primary Role</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
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
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          Pending OTP
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-stone-500 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(u.id, u.isActive)}
                          className={`font-bold text-[11px] px-2.5 py-1 rounded-lg border transition ${
                            u.isActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
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
      ) : (
        /* Administrators Table */
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/50 text-purple-900 border-b border-purple-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Admin Name & Email</th>
                  <th className="p-4">Administrative Role</th>
                  <th className="p-4">Privileges & Permissions</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAdmins.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/20 transition">
                    <td className="p-4">
                      <p className="font-extrabold text-stone-900 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        {a.fullName}
                      </p>
                      <p className="text-[11px] text-stone-500 font-mono">{a.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
                        {a.adminProfile?.adminRole || 'ADMIN'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {a.adminProfile?.permissions?.includes('*') ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Super Admin (All Privileges: *)
                          </span>
                        ) : (
                          a.adminProfile?.permissions?.slice(0, 5).map((p: string) => (
                            <span
                              key={p}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700"
                            >
                              {p}
                            </span>
                          ))
                        )}
                        {a.adminProfile?.permissions &&
                          a.adminProfile.permissions.length > 5 &&
                          !a.adminProfile.permissions.includes('*') && (
                            <span className="text-[9px] font-bold text-stone-400">
                              +{a.adminProfile.permissions.length - 5} more
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="p-4 text-stone-500 font-mono text-[11px]">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Administrator Modal */}
      {addAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            ref={addAdminRef}
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Invite / Create Administrator</h3>
                  <p className="text-[11px] text-stone-500">Configure role-based access for new platform staff</p>
                </div>
              </div>
              <button
                onClick={() => setAddAdminModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanya Kapoor"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@platform.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 chars with uppercase, digit & symbol"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Administrative Role *</label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN (Halls, Bookings, Users, Reviews)</option>
                  <option value="VERIFICATION_ADMIN">VERIFICATION_ADMIN (Manager KYC, Hall & Occasion Moderation)</option>
                  <option value="FINANCE_ADMIN">FINANCE_ADMIN (Payments, Commission, Refunds, Reports)</option>
                  <option value="SUPPORT_ADMIN">SUPPORT_ADMIN (Bookings, Inquiries, User Assistance)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Unrestricted Access: *)</option>
                </select>
                <p className="mt-1 text-[11px] text-stone-500">
                  Role automatically grants designated permissions according to the RBAC policy.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddAdminModalOpen(false)}
                  className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdmin}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  {savingAdmin ? 'Creating Account...' : 'Create Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
