import React, { useState, useEffect, useMemo } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';

export default function LogEntryTab() {
    const [plate, setPlate] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupStatus, setLookupStatus] = useState('idle'); // 'idle' | 'searching' | 'found' | 'not-found'
    const [isVisitor, setIsVisitor] = useState(false);

    // Visitor details (only used when plate is unknown and "Check-in as Guest Visitor" is on)
    const [visitorName, setVisitorName] = useState('');
    const [visitorGroup, setVisitorGroup] = useState('Guest Visitor');

    const [zones, setZones] = useState([]);
    const [selectedZoneId, setSelectedZoneId] = useState('');

    // Status feedback
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null); // { kind: 'success' | 'error', text: string }
    const [toast, setToast] = useState(null);

    // ---- Load live zones once ----
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await uniparkApi.getZoneOccupancy();
                if (cancelled) return;
                setZones(data);
                if (data.length > 0) {
                    setSelectedZoneId(data[0].zone_id || data[0].id || '');
                }
            } catch (err) {
                if (!cancelled) {
                    setFeedback({ kind: 'error', text: `Failed to load zones: ${err.message}` });
                }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ---- Debounced driver lookup as plate changes ----
    useEffect(() => {
        const cleanPlate = plate.toUpperCase().trim();
        if (cleanPlate.length < 3) {
            setLookupResult(null);
            setLookupStatus('idle');
            return undefined;
        }
        setLookupStatus('searching');
        const handle = setTimeout(async () => {
            try {
                // Drive the directory through the vehicles endpoint and resolve
                // the driver by license plate. The endpoint already returns
                // the friendly name, role, department, and phone so we don't
                // need a second lookup call. Pulls up to 200 records, which
                // is more than enough for a campus registry.
                const vehicles = await uniparkApi.getAllVehicles({ limit: 200 });
                const found = (vehicles || []).find(
                    (v) => (v.plate || v.registration_number || '').toUpperCase() === cleanPlate,
                );
                if (found) {
                    setLookupResult({ ...found, plate: cleanPlate });
                    setLookupStatus('found');
                    setIsVisitor(false);
                } else {
                    setLookupResult(null);
                    setLookupStatus('not-found');
                }
            } catch (err) {
                setLookupResult(null);
                setLookupStatus('not-found');
            }
        }, 350);
        return () => clearTimeout(handle);
    }, [plate]);

    const selectedZone = useMemo(
        () => zones.find((z) => (z.zone_id || z.id) === selectedZoneId) || null,
        [zones, selectedZoneId],
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);
        if (!plate) {
            setFeedback({ kind: 'error', text: 'Please input a license plate.' });
            return;
        }
        const cleanPlate = plate.toUpperCase().trim();
        if (!selectedZoneId) {
            setFeedback({ kind: 'error', text: 'Please select a parking zone.' });
            return;
        }
        if (lookupStatus !== 'found' && !isVisitor) {
            setFeedback({
                kind: 'error',
                text: 'Plate is not registered. Tick "Check-in as Guest Visitor" or verify the plate.',
            });
            return;
        }

        setSubmitting(true);
        try {
            const payload = { parking_zone_id: selectedZoneId };
            if (lookupStatus === 'found') {
                payload.registration_number = cleanPlate;
            } else {
                payload.guest_registration = cleanPlate;
                payload.guest_name = visitorName.trim();
                payload.guest_group = visitorGroup;
            }
            const result = await uniparkApi.logVehicleEntry(payload);
            setToast({
                kind: 'success',
                text: `Logged ${result.vehicle_registration || result.guest_registration} into ${result.parking_zone_name || 'zone'}.`,
            });
            // Reset form
            setPlate('');
            setLookupResult(null);
            setLookupStatus('idle');
            setIsVisitor(false);
            setVisitorName('');
            setVisitorGroup('Guest Visitor');
            // Refresh zones so the live occupancy counter ticks up
            const updatedZones = await uniparkApi.getZoneOccupancy();
            setZones(updatedZones);
            window.setTimeout(() => setToast(null), 3500);
        } catch (err) {
            setFeedback({ kind: 'error', text: err.message || 'Failed to log entry.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Log Vehicle Entry</h1>
                <p className="text-gray-500 mt-1">Check-in inbound vehicles at the entry barriers.</p>
            </div>

            {toast && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                    {toast.text}
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Plate Search Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            License Plate Number
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                placeholder="E.g., KDC 456X"
                                className="w-full px-5 py-3.5 border-2 border-gray-200 focus:border-blue-700 rounded-xl text-lg font-bold uppercase tracking-wide focus:outline-none transition duration-150"
                                required
                            />
                            {lookupStatus === 'searching' && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs text-gray-400 font-semibold">
                                    Searching…
                                </span>
                            )}
                            {lookupStatus === 'found' && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">
                                        ✓ Registered
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Lookup Output / Dynamic form section */}
                    {plate.trim().length >= 3 && (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 transition-all duration-300">
                            {lookupStatus === 'searching' && (
                                <p className="text-xs text-gray-500">Looking up plate…</p>
                            )}
                            {lookupStatus === 'found' && lookupResult && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Driver Found</p>
                                    <div className="mt-3 grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Full Name</span>
                                            <span className="text-sm font-semibold text-gray-800">
                                                {lookupResult.name || 'Unknown driver'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Role / Affiliation</span>
                                            <span className="inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 uppercase">
                                                {lookupResult.idLabel || lookupResult.role || 'driver'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Department / Group</span>
                                            <span className="text-sm font-semibold text-gray-800">
                                                {lookupResult.department || '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Phone Number</span>
                                            <span className="text-sm font-semibold text-gray-800">
                                                {lookupResult.phone || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {lookupStatus === 'not-found' && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Plate Not Registered</p>
                                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={isVisitor}
                                                onChange={(e) => setIsVisitor(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                                            />
                                            Check-in as Guest Visitor
                                        </label>
                                    </div>

                                    {isVisitor && (
                                        <div className="mt-4 space-y-3.5 border-t border-slate-200/60 pt-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                                    Visitor Name (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={visitorName}
                                                    onChange={(e) => setVisitorName(e.target.value)}
                                                    placeholder="E.g., Sharon Wambui"
                                                    className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                                    Department / Group
                                                </label>
                                                <select
                                                    value={visitorGroup}
                                                    onChange={(e) => setVisitorGroup(e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                >
                                                    <option value="Guest Visitor">Guest Visitor</option>
                                                    <option value="Conference / Event">Conference/Event</option>
                                                    <option value="Contractor / Service">Contractor/Service</option>
                                                    <option value="Other Office">Other Office</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Zone Assignment Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Assign Parking Lot Zone
                        </label>
                        <select
                            value={selectedZoneId}
                            onChange={(e) => setSelectedZoneId(e.target.value)}
                            className="w-full px-5 py-3.5 border-2 border-gray-200 focus:border-blue-700 bg-white rounded-xl text-base font-semibold focus:outline-none transition duration-150 cursor-pointer"
                        >
                            {zones.length === 0 && (
                                <option value="" disabled>Loading zones…</option>
                            )}
                            {zones.map((zone) => {
                                const total = zone.total_spaces || zone.total || 0;
                                const occupied = zone.occupied_spaces ?? zone.occupied ?? 0;
                                const free = Math.max(total - occupied, 0);
                                const id = zone.zone_id || zone.id;
                                return (
                                    <option key={id} value={id}>
                                        {zone.zone_name || zone.name} ({zone.zone_code || zone.code}) — {free} free of {total}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {feedback && feedback.kind === 'error' && (
                        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
                            {feedback.text}
                        </div>
                    )}

                    {/* Check In Action Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-xl py-4 font-bold text-base shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 11l3-3m0 0l3 3m-3-3v8m0 5a9 9 0 110-18 9 9 0 010 18z" />
                        </svg>
                        {submitting ? 'Logging…' : 'Log Gate Check-In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
