import React, { useState } from 'react';

const PRESETS = [
    { id: 'block', text: 'Please move your vehicle. It is currently blocking another parking slot/driveway.' },
    { id: 'lights', text: 'Notice: Your vehicle lights were left turned on. Please return to switch them off.' },
    { id: 'alarm', text: 'Attention: Your vehicle alarm is currently ringing. Please check on your car.' },
    { id: 'improper', text: 'Please park properly. Your vehicle is occupying multiple bays.' },
];

export default function ContactDriverTab({ registeredDrivers, triggerToast }) {
    const [searchPlate, setSearchPlate] = useState('');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('block');
    const [customMessage, setCustomMessage] = useState('');
    const [sentAlerts, setSentAlerts] = useState([
        { id: '1', driver: 'Griffin Sitati', plate: 'KBB 123A', message: 'Your vehicle lights were left turned on. Please return to switch them off.', channel: 'SMS & App Notification', time: '10 mins ago' },
    ]);

    const handleSearch = (e) => {
        e.preventDefault();
        const clean = searchPlate.toUpperCase().trim();
        const driver = registeredDrivers.find(d => d.plate.toUpperCase() === clean);
        if (driver) {
            setSelectedDriver(driver);
        } else {
            setSelectedDriver(null);
            triggerToast(`No registered driver found for plate: ${clean}`);
        }
    };

    const handleSendAlert = (e) => {
        e.preventDefault();
        if (!selectedDriver) return;

        let messageText = '';
        if (selectedTemplate === 'custom') {
            if (!customMessage.trim()) {
                alert('Please type a custom message.');
                return;
            }
            messageText = customMessage.trim();
        } else {
            const foundPreset = PRESETS.find(p => p.id === selectedTemplate);
            messageText = foundPreset ? foundPreset.text : '';
        }

        // Add to alert log
        const newAlert = {
            id: `alert-${Date.now()}`,
            driver: selectedDriver.name,
            plate: selectedDriver.plate,
            message: messageText,
            channel: 'SMS & App Notification',
            time: 'Just now'
        };

        setSentAlerts([newAlert, ...sentAlerts]);
        triggerToast(`Alert sent successfully to ${selectedDriver.name} via ${newAlert.channel}!`);

        // Reset
        setSelectedDriver(null);
        setSearchPlate('');
        setCustomMessage('');
        setSelectedTemplate('block');
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Contact a Driver</h1>
                <p className="text-gray-500 mt-1">Alert driver owners regarding parking issues, active vehicle alarms, or lights left on.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Search & Compose Box (3/5 width) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search Panel */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                            <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Find Driver by License Plate
                        </h2>

                        <form onSubmit={handleSearch} className="flex gap-3">
                            <input
                                type="text"
                                value={searchPlate}
                                onChange={(e) => setSearchPlate(e.target.value)}
                                placeholder="E.g., KDC 456X"
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase font-bold tracking-wide"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-2.5 font-semibold transition cursor-pointer"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Messaging Panel */}
                    {selectedDriver && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
                            <div className="flex justify-between items-start pb-4 border-b border-gray-100 mb-6">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-snug">{selectedDriver.name}</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{selectedDriver.role} &bull; {selectedDriver.department}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg font-mono font-bold text-sm text-blue-700">
                                    {selectedDriver.plate}
                                </span>
                            </div>

                            <form onSubmit={handleSendAlert} className="space-y-4">
                                {/* Message Presets */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                        Select Template Notification
                                    </label>
                                    <div className="space-y-2">
                                        {PRESETS.map(preset => (
                                            <label 
                                                key={preset.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                                                    selectedTemplate === preset.id
                                                        ? 'bg-blue-50/50 border-blue-200 text-blue-800'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="template"
                                                    value={preset.id}
                                                    checked={selectedTemplate === preset.id}
                                                    onChange={() => setSelectedTemplate(preset.id)}
                                                    className="mt-0.5 text-blue-700 focus:ring-blue-500 border-gray-300"
                                                />
                                                <span className="text-sm font-medium">{preset.text}</span>
                                            </label>
                                        ))}

                                        <label 
                                            className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                                                selectedTemplate === 'custom'
                                                    ? 'bg-blue-50/50 border-blue-200 text-blue-800'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="template"
                                                value="custom"
                                                checked={selectedTemplate === 'custom'}
                                                onChange={() => setSelectedTemplate('custom')}
                                                className="mt-0.5 text-blue-700 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="text-sm font-medium">Custom Message Alert</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Custom Text Area */}
                                {selectedTemplate === 'custom' && (
                                    <div className="animate-slideDown">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                            Custom Message
                                        </label>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            rows="3"
                                            placeholder="Write message details..."
                                            className="w-full px-4.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Channel Badges display */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-medium">Recipient Contacts</span>
                                    <div className="flex gap-2 font-semibold text-slate-700">
                                        <span className="px-2 py-0.5 bg-slate-200/60 rounded">{selectedDriver.phone}</span>
                                        <span className="px-2 py-0.5 bg-slate-200/60 rounded truncate max-w-[150px]">{selectedDriver.email}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 font-semibold shadow-md shadow-blue-500/15 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Dispatch Message Notification
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Sent History Log (2/5 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Alert Dispatch Log</h2>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs divide-y divide-gray-100">
                        {sentAlerts.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No alerts dispatched in this session.</p>
                        ) : (
                            sentAlerts.map(alert => (
                                <div key={alert.id} className="py-3.5 first:pt-0 last:pb-0">
                                    <div className="flex justify-between items-start gap-2 mb-1.5">
                                        <div>
                                            <span className="font-bold text-slate-800 text-sm tracking-tight">{alert.driver}</span>
                                            <span className="text-xs text-gray-400 font-medium ml-1">({alert.plate})</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">{alert.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 leading-relaxed">
                                        "{alert.message}"
                                    </p>
                                    <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Sent via {alert.channel}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
