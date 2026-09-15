'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Shield, Clock, Search, Filter } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        if (res.ok) {
          setLogs(data.auditLogs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const action = log.action.toLowerCase();
    const actor = (log.actor?.fullName || log.actorEmail || '').toLowerCase();
    const entity = log.entityType.toLowerCase();
    return action.includes(q) || actor.includes(q) || entity.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-600" />
          <span>Immutable System Audit Trail</span>
        </h1>
        <p className="text-xs text-stone-500">
          Permanent security and administrative operation record. Immutable by ordinary users.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
        <input
          type="text"
          placeholder="Filter by action, actor, or entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading audit trail...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <FileText className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-xs text-stone-500 font-bold">No audit records match.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Performed By</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Details / Metadata</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50 transition font-sans">
                    <td className="p-4 font-mono font-bold text-purple-900">{log.action}</td>
                    <td className="p-4 font-bold text-stone-700">{log.entityType}</td>
                    <td className="p-4">
                      <p className="font-semibold text-stone-900">{log.actor?.fullName || log.actorEmail || 'SYSTEM'}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-bold uppercase">
                        {log.actorRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="p-4 text-stone-600 font-mono text-[10px] max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="p-4 text-right font-mono text-stone-500 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
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
