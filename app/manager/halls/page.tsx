'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, PlusCircle, Star, Users, MapPin, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ManagerHallsPage() {
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/manager/halls');
        if (res.ok) {
          const data = await res.json();
          setHalls(data.halls || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">My Banquet Halls</h1>
          <p className="text-xs text-stone-500">Manage venue configurations, pricing, media, and approval statuses</p>
        </div>

        <Link
          href="/manager/halls/new"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Hall Listing</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading your venues...</div>
      ) : halls.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-base">You haven't listed any banquet halls yet.</h3>
          <p className="text-xs text-stone-500">Create your first hall listing to start accepting customer bookings.</p>
          <Link
            href="/manager/halls/new"
            className="inline-block mt-2 px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow"
          >
            Create Hall Listing →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {halls.map((hall) => (
            <div
              key={hall.id}
              className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-stone-100">
                  <img
                    src={hall.media?.[0]?.url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'}
                    alt={hall.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow ${
                        hall.status === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : hall.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500 text-stone-900'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {hall.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-800">
                      {hall.city?.name}, {hall.locality?.name}
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 mt-0.5">{hall.name}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1">{hall.description}</p>
                  </div>

                  {/* Rejection notice if applicable */}
                  {hall.status === 'REJECTED' && hall.rejectionReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-0.5">
                      <p className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Rejection Reason:</span>
                      </p>
                      <p>{hall.rejectionReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 pt-2 border-t border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Capacity</span>
                      <span className="font-semibold">{hall.minCapacity} – {hall.maxCapacity} Guests</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Base Rental</span>
                      <span className="font-semibold">₹{(hall.pricingRule?.baseRentalPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Supported Occasions count */}
                  <div className="text-[11px] text-stone-500">
                    Supported Occasions: <strong>{hall.occasions?.filter((o: any) => o.status === 'APPROVED').length} approved</strong> / {hall.occasions?.length} requested
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                {hall.status === 'APPROVED' ? (
                  <Link href={`/halls/${hall.slug || hall.id}`} className="text-amber-800 font-bold hover:underline">
                    View Live Marketplace Page →
                  </Link>
                ) : (
                  <span className="text-[11px] text-stone-400 italic">Hidden from customer search</span>
                )}

                <Link
                  href={`/manager/halls/${hall.id}`}
                  className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl transition"
                >
                  Edit Configuration
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
