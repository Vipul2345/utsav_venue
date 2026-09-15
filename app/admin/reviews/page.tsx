'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, AlertTriangle, EyeOff, Trash2 } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      });

      if (!res.ok) throw new Error('Action failed');
      fetchReviews();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Customer Reviews Moderation</h1>
        <p className="text-xs text-stone-500">Monitor ratings, address flagged feedback, and protect venue integrity</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
          <Star className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-xs text-stone-500 font-bold">No customer reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-sm">{r.hall.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      Ref: {r.booking?.bookingNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        r.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'FLAGGED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-stone-500 mt-0.5">
                    Written by: <strong>{r.customer?.fullName}</strong> ({r.customer?.email})
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                  <span className="ml-1 text-stone-700">{r.rating}/5</span>
                </div>
              </div>

              {r.title && <p className="font-bold text-stone-900 text-xs">{r.title}</p>}
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl">{r.content}</p>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-[10px] text-stone-400">
                  Posted on {new Date(r.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                </span>

                <div className="flex items-center gap-1.5">
                  {r.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleModerate(r.id, 'APPROVE')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                    >
                      Approve & Publish
                    </button>
                  )}
                  {r.status !== 'FLAGGED' && (
                    <button
                      onClick={() => handleModerate(r.id, 'FLAG')}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl"
                    >
                      Flag
                    </button>
                  )}
                  {r.status !== 'HIDDEN' && (
                    <button
                      onClick={() => handleModerate(r.id, 'HIDE')}
                      className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                    >
                      Hide
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
