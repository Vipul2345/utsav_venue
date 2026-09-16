'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Check,
  X,
  Building2,
  Search,
  Filter,
  Globe,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useModalDismiss } from '@/lib/hooks/useModalDismiss';

interface LocalityItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface CityItem {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  isActive: boolean;
  localities: LocalityItem[];
  _count?: {
    halls: number;
  };
}

export default function AdminLocationsPage() {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  // Modals state
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [addLocalityModalOpen, setAddLocalityModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Selected city for adding locality or editing
  const [targetCityId, setTargetCityId] = useState<string>('');
  const [editTarget, setEditTarget] = useState<{
    id: string;
    type: 'CITY' | 'LOCALITY';
    name: string;
    state?: string;
    country?: string;
  } | null>(null);

  // Form states
  const [cityName, setCityName] = useState('');
  const [cityState, setCityState] = useState('');
  const [cityCountry, setCityCountry] = useState('India');
  const [localityName, setLocalityName] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refs for modal dismissal
  const addCityRef = useRef<HTMLDivElement>(null);
  const addLocalityRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  useModalDismiss(addCityRef, () => setAddCityModalOpen(false), addCityModalOpen);
  useModalDismiss(addLocalityRef, () => setAddLocalityModalOpen(false), addLocalityModalOpen);
  useModalDismiss(editRef, () => setEditModalOpen(false), editModalOpen);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/locations');
      const data = await res.json();
      if (res.ok) {
        setCities(data.cities || []);
      }
    } catch (e) {
      console.error('Failed to fetch locations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const distinctStates = Array.from(new Set(cities.map((c) => c.state))).filter(Boolean).sort();

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CITY',
          name: cityName.trim(),
          state: cityState.trim(),
          country: cityCountry.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create city');

      setSuccess(`City '${cityName}' added successfully!`);
      setCityName('');
      setCityState('');
      setAddCityModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCALITY',
          cityId: targetCityId,
          name: localityName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create locality');

      setSuccess(`Locality '${localityName}' added successfully!`);
      setLocalityName('');
      setAddLocalityModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          type: editTarget.type,
          name: editTarget.name.trim(),
          state: editTarget.state?.trim(),
          country: editTarget.country?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update location');

      setSuccess(`Location updated successfully!`);
      setEditModalOpen(false);
      setEditTarget(null);
      fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, type: 'CITY' | 'LOCALITY', currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          type,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      fetchLocations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredCities = cities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase()) ||
      c.localities.some((l) => l.name.toLowerCase().includes(search.toLowerCase()));
    const matchesState = selectedState === 'ALL' || c.state === selectedState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-brand-600" />
            Dynamic Location Management
          </h1>
          <p className="text-xs text-stone-500">
            Manage supported Countries, States, Cities, and Localities for search filtering and venue listings
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setAddCityModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Add New City
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by city, state, or locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All States ({cities.length} Cities)</option>
            {distinctStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading dynamic locations...</div>
      ) : filteredCities.length === 0 ? (
        <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-xs text-stone-500">
          No locations match your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              className={`bg-white border rounded-2xl p-5 space-y-4 shadow-sm transition ${
                city.isActive ? 'border-stone-200 hover:border-amber-300' : 'border-stone-200 bg-stone-50/50 opacity-70'
              }`}
            >
              {/* City Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-stone-900">{city.name}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        city.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {city.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {city.state}, {city.country} • {city._count?.halls || 0} Halls listed
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditTarget({
                        id: city.id,
                        type: 'CITY',
                        name: city.name,
                        state: city.state,
                        country: city.country,
                      });
                      setEditModalOpen(true);
                    }}
                    title="Edit City"
                    className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => toggleStatus(city.id, 'CITY', city.isActive)}
                    title={city.isActive ? 'Disable City' : 'Enable City'}
                    className={`p-1.5 rounded-lg transition ${
                      city.isActive
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {city.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Localities Section */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                  <span>Localities / Areas ({city.localities.length})</span>
                  <button
                    onClick={() => {
                      setTargetCityId(city.id);
                      setAddLocalityModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Area
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {city.localities.map((loc) => (
                    <span
                      key={loc.id}
                      className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        loc.isActive
                          ? 'bg-amber-50/60 border-amber-200 text-stone-800'
                          : 'bg-stone-100 border-stone-200 text-stone-400 line-through'
                      }`}
                    >
                      <span>{loc.name}</span>
                      <button
                        onClick={() => {
                          setEditTarget({
                            id: loc.id,
                            type: 'LOCALITY',
                            name: loc.name,
                          });
                          setEditModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-brand-700 transition"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => toggleStatus(loc.id, 'LOCALITY', loc.isActive)}
                        title={loc.isActive ? 'Disable Area' : 'Enable Area'}
                        className="opacity-0 group-hover:opacity-100 hover:text-stone-900 transition"
                      >
                        {loc.isActive ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5 text-emerald-600" />}
                      </button>
                    </span>
                  ))}
                  {city.localities.length === 0 && (
                    <span className="text-[11px] text-stone-400 italic">No localities added yet</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add City Modal */}
      {addCityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            ref={addCityRef}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                Add New City
              </h3>
              <button
                onClick={() => setAddCityModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleAddCity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Country *</label>
                <input
                  type="text"
                  required
                  placeholder="India"
                  value={cityCountry}
                  onChange={(e) => setCityCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddCityModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Locality Modal */}
      {addLocalityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            ref={addLocalityRef}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" />
                Add Locality / Area
              </h3>
              <button
                onClick={() => setAddLocalityModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleAddLocality} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Locality / Area Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Koregaon Park"
                  value={localityName}
                  onChange={(e) => setLocalityName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddLocalityModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Locality'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {editModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            ref={editRef}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-600" />
                Edit {editTarget.type === 'CITY' ? 'City' : 'Locality'}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={editTarget.name}
                  onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {editTarget.type === 'CITY' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={editTarget.state || ''}
                      onChange={(e) => setEditTarget({ ...editTarget, state: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={editTarget.country || ''}
                      onChange={(e) => setEditTarget({ ...editTarget, country: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
