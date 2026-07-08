import React, { useState, useEffect } from 'react';
import { ASSETS } from '../../../constants/assets';
import { uniparkApi } from '../../../utils/uniparkApi';

function buildSegments(zones) {
    const mainGroups = [
        {
            id: 'phase1',
            name: 'Phase 1',
            description: 'Main zone',
            sourceNames: ['Phase 1'],
            subZoneNames: ['Phase 1'],
            occupancy: 0,
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            subZones: [],
        },
        {
            id: 'phase2',
            name: 'Phase 2',
            description: 'Main zone with smaller lots',
            sourceNames: ['Phase 2'],
            subZoneNames: ['Library Lot', 'Graduation Square', 'MSB Lot', 'Engineering Lot', 'Gate E Lot'],
            occupancy: 0,
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
            subZones: [],
        },
        {
            id: 'sbs',
            name: 'SBS Lot',
            description: 'Main zone',
            sourceNames: ['SBS Lot'],
            subZoneNames: ['SBS Lot'],
            occupancy: 0,
            badgeColor: 'bg-sky-50 text-sky-700 border-sky-100',
            subZones: [],
        },
        {
            id: 'sports',
            name: 'Sports Complex Lot',
            description: 'Main zone',
            sourceNames: ['Sports Complex Lot'],
            subZoneNames: ['Sports Complex Lot'],
            occupancy: 0,
            badgeColor: 'bg-red-50 text-red-700 border-red-100',
            subZones: [],
        },
    ];

    const zoneByName = new Map(zones.map((zone) => [zone.zone_name.toLowerCase(), zone]));

    const toSubZone = (zone) => {
        const occupancy = Number(zone.occupancy_percentage || 0);
        return {
            name: zone.zone_name,
            code: zone.zone_code,
            capacity: zone.total_spaces,
            occupied: zone.occupied_spaces,
            available: zone.available_spaces,
            reserved: zone.reserved_spaces,
            cordoned: zone.cordoned_spaces,
            maintenance: zone.maintenance_spaces,
            occupancy,
            status: occupancy >= 75 ? 'HIGHLY BUSY' : occupancy >= 40 ? 'NORMAL BUSY' : 'AVAILABLE',
            statusColor: occupancy >= 75
                ? 'text-red-700 bg-red-50'
                : occupancy >= 40
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-emerald-700 bg-emerald-50',
        };
    };

    mainGroups.forEach((group) => {
        const mainZone = group.sourceNames
            .map((name) => zoneByName.get(name.toLowerCase()))
            .find(Boolean);

        group.subZones = group.subZoneNames
            .map((name) => zoneByName.get(name.toLowerCase()))
            .filter(Boolean)
            .map(toSubZone);

        if (mainZone) {
            group.occupancy = Math.round(Number(mainZone.occupancy_percentage || 0));
        } else if (group.subZones.length > 0) {
            const averageOccupancy = group.subZones.reduce((sum, zone) => sum + zone.occupancy, 0) / group.subZones.length;
            group.occupancy = Math.round(averageOccupancy);
        }
    });

    return mainGroups;
}

export default function DriverZonesTab() {
    const [expandedSegments, setExpandedSegments] = useState({
        'phase1': false,
        'phase2': true,
        'sbs': false,
        'sports': false
    });

    const [selectedZone, setSelectedZone] = useState(null);
    const [segments, setSegments] = useState([]);
    const [isLoadingZones, setIsLoadingZones] = useState(true);
    const [zonesError, setZonesError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadZones = async () => {
            try {
                setIsLoadingZones(true);
                setZonesError('');

                const response = await uniparkApi.getZoneOccupancy();
                if (isMounted) {
                    setSegments(buildSegments(response));
                }
            } catch (error) {
                if (isMounted) {
                    setSegments([]);
                    setZonesError(error.message || 'Unable to load zone occupancy right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingZones(false);
                }
            }
        };

        loadZones();

        return () => {
            isMounted = false;
        };
    }, []);

    const toggleSegment = (segmentId) => {
        setExpandedSegments(prev => ({
            ...prev,
            [segmentId]: !prev[segmentId]
        }));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Campus Parking Zones</h1>
                <div className="flex gap-2">
                    {/* Mock Filter Trigger */}
                    <button
                        onClick={() => alert('Filter applied: showing all active zones.')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v3.2a1 1 0 01-.293.707L12 11.414V17a1 1 0 01-.447.894l-2 1.333a1 1 0 01-1.553-.894V11.414L3.293 7.907A1 1 0 013 7.2V4z" />
                        </svg>
                        Filter
                    </button>
                </div>
            </div>

            {/* Accordion facility segments */}
            <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Facility Segments</p>

                {isLoadingZones && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-600 shadow-xs">
                        Loading live zone occupancy...
                    </div>
                )}

                {zonesError && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800 shadow-xs">
                        {zonesError}
                    </div>
                )}

                {segments.map((seg) => {
                    const isExpanded = expandedSegments[seg.id];
                    return (
                        <div key={seg.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition duration-150">
                            {/* Accordion Trigger row */}
                            <button
                                onClick={() => toggleSegment(seg.id)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/55 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                                        {seg.id === 'phase1' && (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        )}
                                        {seg.id === 'phase2' && (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        )}
                                        {seg.id === 'sbs' && (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        {seg.id === 'sports' && (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">{seg.name}</h3>
                                        <p className="text-xs text-slate-500">{seg.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${seg.badgeColor}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${seg.occupancy >= 90 ? 'bg-red-500 animate-pulse' :
                                                seg.occupancy >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                        {seg.occupancy}% Occupancy
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-slate-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Collapsible Expanded Table */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                                <th className="px-6 py-3.5">Zone Name</th>
                                                <th className="px-6 py-3.5">Capacity</th>
                                                <th className="px-6 py-3.5">Occupied</th>
                                                <th className="px-6 py-3.5">Status</th>
                                                <th className="px-6 py-3.5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {seg.subZones.map((sub, i) => {
                                                const fillPercent = Math.round((sub.occupied / sub.capacity) * 100);
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50/30 transition text-sm">
                                                        <td className="px-6 py-4 font-bold text-slate-800">
                                                            <div>{sub.name}</div>
                                                            <div className="mt-0.5 text-[10px] font-medium text-slate-400">{sub.code}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">{sub.capacity} Spots</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-semibold text-slate-700 min-w-[70px]">{sub.occupied} spots</span>
                                                                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                                                    <div
                                                                        className={`h-full rounded-full ${fillPercent >= 90 ? 'bg-red-500' :
                                                                                fillPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                            }`}
                                                                        style={{ width: `${fillPercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${sub.statusColor}`}>
                                                                {sub.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => setSelectedZone(sub)}
                                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                            >
                                                                Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}

                {!isLoadingZones && !zonesError && segments.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500 shadow-xs">
                        No zone occupancy data was returned.
                    </div>
                )}
            </div>

            {/* Map overview */}
            {/* <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Zone Map Overview</h2>
                    <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center p-2">
                    <img
                        src={ASSETS.campusMap}
                        alt="UniPark Campus 3D Isometric Map"
                        className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm"
                    />
                </div>
            </div> */}

            {/* Dynamic details drawer/modal */}
            {selectedZone && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedZone(null)} />
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden relative z-10 p-6 animate-in fade-in zoom-in duration-150">
                        <button
                            onClick={() => setSelectedZone(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-2">{selectedZone.name} Details</h3>
                        <div className="space-y-3.5 my-5 text-xs text-slate-600">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400">Total Capacity</span>
                                <span className="font-semibold text-slate-800">{selectedZone.capacity} Spots</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400">Occupied Bays</span>
                                <span className="font-semibold text-slate-800">{selectedZone.occupied} Spots</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400">Occupancy</span>
                                <span className="font-semibold text-slate-800">{selectedZone.occupancy}%</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400">Rate / Fee</span>
                                <span className="font-bold text-emerald-600">FREE PARKING</span>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="text-gray-400">Assigned Restrictions</span>
                                <span className="font-semibold text-slate-800">Cordon zones apply for events</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedZone(null)}
                            className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
