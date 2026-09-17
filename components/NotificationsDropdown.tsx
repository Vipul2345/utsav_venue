'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

export default function NotificationsDropdown({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useModalDismiss(dropdownRef, () => setIsOpen(false), isOpen);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-full transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-stone-900/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs transition ${
                    n.isRead ? 'bg-white' : 'bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{n.title}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
                    >
                      <span>View details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
