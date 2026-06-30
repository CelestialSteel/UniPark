import React, { useState, useEffect } from 'react';

export default function LogEntryTab({ zones, registeredDrivers, onLogEntry }) {
    const [plate, setPlate] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [isVisitor, setIsVisitor] = useState(false);
    
    // Visitor details if plate not found or guard chooses visitor mode
    const [visitorName, setVisitorName] = useState('');
    const [visitorPhone, setVisitorPhone] = useState('');
    const [visitorDept, setVisitorDept] = useState('Guest Visitor');

    const [selectedZone, setSelectedZone] = useState('');

    useEffect(() => {
        if (zones && zones.length > 0) {
            // Default to first active zone
            setSelectedZone(zones[0].name);
        }
    }, [zones]);

    // Lookup driver as plate changes
    useEffect(() => {
        const cleanPlate = plate.toUpperCase().trim();
        if (cleanPlate.length >= 3) {
            const found = registeredDrivers.find(d => d.plate.toUpperCase() === cleanPlate);
            if (found) {
                setLookupResult(found);
                setIsVisitor(false);
            } else {
                setLookupResult(null);
            }
        } else {
            setLookupResult(null);
        }
    }, [plate, registeredDrivers]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!plate) {
            alert('Please input a license plate.');
            return;
        }

        const cleanPlate = plate.toUpperCase().trim();
        let driverName = '';
        let driverRole = 'Visitor';
        let driverDept = 'Guest Visitor';

        if (lookupResult) {
            driverName = lookupResult.name;
            driverRole = lookupResult.role;
            driverDept = lookupResult.department;
        } else if (isVisitor) {
            driverName = visitorName.trim() || 'Guest Visitor';
            driverRole = 'Visitor';
            driverDept = visitorDept;
        } else {
            // Unregistered but not explicitly checked as visitor - default to visitor
            driverName = 'Guest Visitor';
            driverRole = 'Visitor';
            driverDept = 'Guest Visitor';
        }

        const success = onLogEntry(cleanPlate, selectedZone, driverName, driverRole, driverDept);
        if (success) {
            // Reset form
            setPlate('');
            setLookupResult(null);
            setIsVisitor(false);
            setVisitorName('');
            setVisitorPhone('');
            setVisitorDept('Guest Visitor');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Log Vehicle Entry</h1>
                <p className="text-gray-500 mt-1">Check-in inbound vehicles at the entry barriers.</p>
            </div>

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
                            {lookupResult && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">
                                        ✓ REGISTERED
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Lookup Output / Dynamic form section */}
                    {plate.trim().length >= 3 && (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 transition-all duration-300">
                            {lookupResult ? (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Driver Found</p>
                                    <div className="mt-3 grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Full Name</span>
                                            <span className="text-sm font-semibold text-gray-800">{lookupResult.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Role / Affiliation</span>
                                            <span className="inline-flex mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 uppercase">
                                                {lookupResult.role}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Department</span>
                                            <span className="text-sm font-semibold text-gray-800">{lookupResult.department}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Phone Number</span>
                                            <span className="text-sm font-semibold text-gray-800">{lookupResult.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
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
                                                    className="w-full px-4.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                                        Phone (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={visitorPhone}
                                                        onChange={(e) => setVisitorPhone(e.target.value)}
                                                        placeholder="E.g., +254 722..."
                                                        className="w-full px-4.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                                        Department / Group
                                                    </label>
                                                    <select
                                                        value={visitorDept}
                                                        onChange={(e) => setVisitorDept(e.target.value)}
                                                        className="w-full px-4.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    >
                                                        <option value="Guest Visitor">Guest Visitor</option>
                                                        <option value="Conference / Event">Conference/Event</option>
                                                        <option value="Contractor / Service">Contractor/Service</option>
                                                        <option value="Other Office">Other Office</option>
                                                    </select>
                                                </div>
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
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="w-full px-5 py-3.5 border-2 border-gray-200 focus:border-blue-700 bg-white rounded-xl text-base font-semibold focus:outline-none transition duration-150 cursor-pointer"
                        >
                            {zones.map((zone) => {
                                const capacityLeft = zone.total - (zone.occupied + zone.reserved + zone.cordoned);
                                return (
                                    <option key={zone.id} value={zone.name}>
                                        {zone.name} ({zone.code}) &mdash; {capacityLeft} free spots of {zone.total}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Check In Action Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-4 font-bold text-base shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 11l3-3m0 0l3 3m-3-3v8m0 5a9 9 0 110-18 9 9 0 010 18z" />
                        </svg>
                        Log Gate Check-In
                    </button>
                </form>
            </div>
        </div>
    );
}
