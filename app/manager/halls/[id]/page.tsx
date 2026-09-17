'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Save, ArrowLeft, AlertCircle, CheckCircle2, Image as ImageIcon, Plus, Trash2, UploadCloud } from 'lucide-react';
import { UploadDropzone } from '@/lib/uploadthing';

export default function ManagerEditHallPage() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.id as string;

  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minCapacity, setMinCapacity] = useState('100');
  const [maxCapacity, setMaxCapacity] = useState('500');
  const [baseRentalPrice, setBaseRentalPrice] = useState('50000');
  const [alcoholAllowed, setAlcoholAllowed] = useState(false);
  const [outsideCateringAllowed, setOutsideCateringAllowed] = useState(false);
  const [outsideDecorAllowed, setOutsideDecorAllowed] = useState(false);
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState('72');
  const [refundPercentage, setRefundPercentage] = useState('80');

  // Media Management State
  interface MediaItemState {
    id?: string;
    url: string;
    isCover: boolean;
    verificationStatus?: string;
    rejectionReason?: string | null;
  }
  const [mediaList, setMediaList] = useState<MediaItemState[]>([]);
  const [maxAllowedImages, setMaxAllowedImages] = useState(5);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [res, metaRes] = await Promise.all([
          fetch(`/api/manager/halls/${hallId}`),
          fetch('/api/meta'),
        ]);

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.maxHallImages) setMaxAllowedImages(metaData.maxHallImages);
        }

        if (!res.ok) throw new Error('Unauthorized or venue not found');
        const data = await res.json();
        const h = data.hall;
        setHall(h);
        setName(h.name);
        setDescription(h.description);
        setMinCapacity(h.minCapacity.toString());
        setMaxCapacity(h.maxCapacity.toString());
        setBaseRentalPrice((h.pricingRule?.baseRentalPrice || 50000).toString());
        setAlcoholAllowed(h.alcoholAllowed);
        setOutsideCateringAllowed(h.outsideCateringAllowed);
        setOutsideDecorAllowed(h.outsideDecorAllowed);
        setCancellationDeadlineHours((h.cancellationDeadlineHours || 72).toString());
        setRefundPercentage((h.refundPercentage || 80).toString());

        if (h.media && h.media.length > 0) {
          setMediaList(
            h.media.map((m: any, idx: number) => ({
              id: m.id,
              url: m.url,
              isCover: m.isCover !== undefined ? m.isCover : idx === 0,
              verificationStatus: m.verificationStatus || 'APPROVED',
              rejectionReason: m.rejectionReason || null,
            }))
          );
        } else {
          setMediaList([
            { url: '', isCover: true, verificationStatus: 'PENDING' },
            { url: '', isCover: false, verificationStatus: 'PENDING' },
          ]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hallId]);

  const updatePhotoUrl = (index: number, newUrl: string) => {
    setMediaList((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const isModified = current.id && current.url !== newUrl;
      copy[index] = {
        ...current,
        url: newUrl,
        // If an existing approved image has its URL edited, reset to PENDING
        verificationStatus: isModified ? 'PENDING' : current.verificationStatus,
        rejectionReason: isModified ? null : current.rejectionReason,
      };
      return copy;
    });
  };

  const setCoverPhoto = (index: number) => {
    setMediaList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        isCover: idx === index,
      }))
    );
  };

  const addPhotoField = () => {
    if (mediaList.length < maxAllowedImages) {
      setMediaList((prev) => [
        ...prev,
        {
          url: '',
          isCover: prev.length === 0,
          verificationStatus: 'PENDING',
        },
      ]);
    }
  };

  const removePhotoField = (index: number) => {
    if (mediaList.length > 2) {
      setMediaList((prev) => {
        const filtered = prev.filter((_, idx) => idx !== index);
        // Ensure at least one image is cover
        if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
          filtered[0].isCover = true;
        }
        return filtered;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const cleanMedia = mediaList
        .map((m) => ({ ...m, url: m.url.trim() }))
        .filter((m) => Boolean(m.url) && /^https?:\/\/.+/i.test(m.url));

      if (cleanMedia.length < 2) {
        throw new Error('A minimum of 2 valid photo URLs is required.');
      }

      if (cleanMedia.length > maxAllowedImages) {
        throw new Error(`You can have at most ${maxAllowedImages} photos for this listing.`);
      }

      // Ensure one cover exists
      if (!cleanMedia.some((m) => m.isCover)) {
        cleanMedia[0].isCover = true;
      }

      const res = await fetch(`/api/manager/halls/${hallId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          minCapacity,
          maxCapacity,
          baseRentalPrice,
          alcoholAllowed,
          outsideCateringAllowed,
          outsideDecorAllowed,
          cancellationDeadlineHours,
          refundPercentage,
          media: cleanMedia,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update hall');

      if (data.hall?.media) {
        setMediaList(
          data.hall.media.map((m: any, idx: number) => ({
            id: m.id,
            url: m.url,
            isCover: m.isCover !== undefined ? m.isCover : idx === 0,
            verificationStatus: m.verificationStatus || 'APPROVED',
            rejectionReason: m.rejectionReason || null,
          }))
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-400">Loading hall configuration...</div>;
  }

  if (error && !hall) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
        <p className="text-xs text-stone-500">{error}</p>
        <Link href="/manager/halls" className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl inline-block">
          Back to My Halls
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/manager/halls" className="p-2 text-stone-400 hover:text-stone-800 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-stone-900">Edit {hall.name}</h1>
            <p className="text-xs text-stone-500">Update capacity, pricing, and guest policies</p>
          </div>
        </div>

        <span
          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
            hall.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800'
              : hall.status === 'PENDING_APPROVAL'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {hall.status}
        </span>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Hall configuration saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-xs">
        <div>
          <label className="block font-semibold text-stone-700 mb-1">Hall Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Description</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Min Capacity</label>
            <input
              type="number"
              required
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Max Capacity</label>
            <input
              type="number"
              required
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">Base Rental Price (₹)</label>
          <input
            type="number"
            required
            value={baseRentalPrice}
            onChange={(e) => setBaseRentalPrice(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Cancellation Notice (Hours)</label>
            <input
              type="number"
              value={cancellationDeadlineHours}
              onChange={(e) => setCancellationDeadlineHours(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Refund Percentage (%)</label>
            <input
              type="number"
              value={refundPercentage}
              onChange={(e) => setRefundPercentage(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={alcoholAllowed}
              onChange={(e) => setAlcoholAllowed(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Alcohol Permitted (with event license)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={outsideCateringAllowed}
              onChange={(e) => setOutsideCateringAllowed(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Outside Catering Allowed</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={outsideDecorAllowed}
              onChange={(e) => setOutsideDecorAllowed(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Outside Decor Allowed</span>
          </label>
        </div>

        {/* Photo Gallery & Moderation Status Section */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Venue Photos & Moderation Status</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Minimum 2 photos required (up to {maxAllowedImages}). Newly uploaded or changed photos enter verification mode.
              </p>
            </div>
            {mediaList.length < maxAllowedImages && (
              <button
                type="button"
                onClick={addPhotoField}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Photo URL</span>
              </button>
            )}
          </div>

          {/* Direct Drag & Drop Cloud Uploader */}
          {mediaList.length < maxAllowedImages && (
            <div className="p-4 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <UploadCloud className="w-4 h-4 text-amber-700" />
                <span>Upload Photos Directly (Cloud Storage)</span>
              </div>
              <UploadDropzone
                endpoint="venueImageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    const newItems = res.map((f) => ({
                      url: f.url,
                      isCover: mediaList.length === 0,
                      verificationStatus: 'PENDING',
                    }));
                    setMediaList((prev) => [...prev.filter((m) => m.url.trim() !== ''), ...newItems].slice(0, maxAllowedImages));
                  }
                }}
                onUploadError={(err: Error) => {
                  setError(`Upload error: ${err.message}`);
                }}
              />
            </div>
          )}

          <div className="space-y-3">
            {mediaList.map((m, idx) => (
              <div
                key={idx}
                className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <div className="w-16 h-14 rounded-xl bg-stone-200 overflow-hidden shrink-0 border border-stone-300 relative">
                  {m.url ? (
                    <img
                      src={m.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                      No image
                    </div>
                  )}
                  {m.isCover && (
                    <span className="absolute bottom-0 inset-x-0 bg-purple-700 text-white text-[8px] font-extrabold text-center py-0.5">
                      COVER
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-500 uppercase">
                      Photo #{idx + 1} {m.isCover && '• Primary Cover'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.verificationStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.verificationStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.verificationStatus === 'APPROVED'
                        ? '✓ Verified & Live'
                        : m.verificationStatus === 'REJECTED'
                        ? '✕ Rejected by Admin'
                        : '⏱ Pending Admin Verification'}
                    </span>
                  </div>

                  <input
                    type="url"
                    required={idx < 2}
                    value={m.url}
                    onChange={(e) => updatePhotoUrl(idx, e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-mono"
                  />

                  {m.rejectionReason && (
                    <p className="text-[10px] text-rose-600 font-semibold">
                      Reason: {m.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {!m.isCover && (
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(idx)}
                      className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-700 transition"
                    >
                      Set Cover
                    </button>
                  )}
                  {mediaList.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePhotoField(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">🛡️ Moderation Note:</span> Photos marked <strong>&quot;Pending Admin Verification&quot;</strong> or <strong>&quot;Rejected&quot;</strong> are not shown to customers on the public marketplace. Once reviewed and verified by an administrator, they will automatically become live.
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
