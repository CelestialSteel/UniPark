import React, { useState } from 'react';
import PublishAnnouncementModal from './PublishAnnouncementModal';

export default function AnnouncementsTab({ announcements, setAnnouncements, triggerToast }) {
    const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
    const [newAnn, setNewAnn] = useState({ title: '', message: '', severity: 'low' });

    const handleAnnSubmit = (e) => {
        e.preventDefault();
        const announcement = {
            id: `ann-${Date.now()}`,
            title: newAnn.title,
            message: newAnn.message,
            severity: newAnn.severity,
            date: new Date().toISOString().split('T')[0],
        };
        setAnnouncements([announcement, ...announcements]);
        setIsAnnModalOpen(false);
        setNewAnn({ title: '', message: '', severity: 'low' });
        triggerToast('Announcement published successfully.');
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Institutional Announcements</h1>
                    <p className="text-gray-500 mt-1">Draft announcements regarding lane closures or reserved parking lots.</p>
                </div>
                <button
                    onClick={() => setIsAnnModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg cursor-pointer"
                >
                    + Compose Announcement
                </button>
            </div>

            {/* Broadcast Announcements Feed */}
            <div className="space-y-5">
                {announcements.map((ann) => (
                    <div key={ann.id} className="p-6 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between hover:border-gray-300 transition">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-800">{ann.title}</h3>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full border ${ann.severity === 'high'
                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                        : ann.severity === 'medium'
                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                            : 'bg-blue-50 text-blue-600 border-blue-200'
                                        }`}>
                                        {ann.severity} Severity
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 mt-1 block">Broadcasted: {ann.date}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setAnnouncements(announcements.filter(a => a.id !== ann.id));
                                    triggerToast('Announcement removed.');
                                }}
                                className="text-xs text-gray-400 hover:text-rose-400 transition cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{ann.message}</p>
                    </div>
                ))}
            </div>

            <PublishAnnouncementModal
                isOpen={isAnnModalOpen}
                onClose={() => setIsAnnModalOpen(false)}
                newAnn={newAnn}
                setNewAnn={setNewAnn}
                onSubmit={handleAnnSubmit}
            />
        </div>
    );
}
