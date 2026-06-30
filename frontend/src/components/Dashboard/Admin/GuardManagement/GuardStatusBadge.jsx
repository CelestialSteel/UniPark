import React from 'react';

export default function GuardStatusBadge({ shift, zone, compact = false }) {
    const now = new Date();
    const hour = now.getHours();

    const isOnShift = (shift) => {
        if (shift === 'Day (6AM-2PM)') return hour >= 6 && hour < 14;
        if (shift === 'Evening (2PM-10PM)') return hour >= 14 && hour < 22;
        if (shift === 'Night (10PM-6AM)') return hour >= 22 || hour < 6;
        return false;
    };

    const onShift = isOnShift(shift);

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                onShift ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${onShift ? 'bg-green-500' : 'bg-gray-400'}`} />
                {onShift ? 'On Shift' : 'Off Shift'}
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                onShift ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
                <span className={`w-2 h-2 rounded-full ${onShift ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {onShift ? 'On Shift' : 'Off Shift'}
            </span>
            {zone && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {zone}
                </span>
            )}
        </div>
    );
}
