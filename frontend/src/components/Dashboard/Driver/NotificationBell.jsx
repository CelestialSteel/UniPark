import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';
import { useAuth } from '../../../context/AuthContext';

// Notification-type → icon + accent color
const TYPE_STYLES = {
    alert: {
        icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        accent: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    reservation: {
        icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        accent: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    system: {
        icon: (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        accent: 'text-slate-600 bg-slate-50 border-slate-100',
    },
};

function getTypeStyle(type) {
    return TYPE_STYLES[type] || TYPE_STYLES.system;
}

/**
 * Formats a timestamp as a friendly relative string (e.g. "2 hours ago").
 * Falls back to a localized date string for older entries.
 */
function formatRelativeTime(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    if (diffSec < 0) {
        return date.toLocaleString();
    }

    if (diffSec < 45) {
        return 'just now';
    }
    if (diffSec < 90) {
        return 'a minute ago';
    }
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) {
        return `${diffMin} minutes ago`;
    }
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) {
        return diffHr === 1 ? 'an hour ago' : `${diffHr} hours ago`;
    }
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) {
        return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAbsolute(value) {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);

    // Demo users (`id` starts with `demo-`) have no backend session,
    // so we keep the legacy alert behavior for them.
    const isDemoUser = !!user?.id && String(user.id).startsWith('demo-');

    const refreshUnreadCount = useCallback(async () => {
        try {
            const data = await uniparkApi.getUnreadNotificationCount();
            setUnreadCount(data?.unread_count ?? 0);
        } catch {
            // Silent: badge will simply read 0 if endpoint is unavailable
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await uniparkApi.getNotifications({ limit: 20 });
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || 'Unable to load notifications.');
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch unread count on mount + every 60s while mounted
    useEffect(() => {
        if (isDemoUser) {
            return;
        }
        refreshUnreadCount();
        const id = setInterval(refreshUnreadCount, 60_000);
        return () => clearInterval(id);
    }, [isDemoUser, refreshUnreadCount]);

    // Refresh the list every time the dropdown opens
    useEffect(() => {
        if (isOpen && !isDemoUser) {
            fetchNotifications();
        }
    }, [isOpen, isDemoUser, fetchNotifications]);

    // Close on outside click + Escape
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (isDemoUser) {
            // Preserve the previous behavior for demo accounts.
            alert('Notifications: You have no unread parking alerts.');
            return;
        }
        setIsOpen((prev) => !prev);
    };

    const handleMarkAsRead = async (id) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        try {
            await uniparkApi.markNotificationAsRead(id);
        } catch {
            // Revert on failure
            await Promise.all([fetchNotifications(), refreshUnreadCount()]);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (isMarkingAll || unreadCount === 0) {
            return;
        }
        setIsMarkingAll(true);
        const previousUnread = unreadCount;
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: new Date().toISOString() })),
        );
        setUnreadCount(0);
        try {
            await uniparkApi.markAllNotificationsAsRead();
        } catch {
            setUnreadCount(previousUnread);
            await Promise.all([fetchNotifications(), refreshUnreadCount()]);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const { unseen, seen } = useMemo(() => {
        const unseenList = [];
        const seenList = [];
        for (const n of notifications) {
            if (n.is_read) {
                seenList.push(n);
            } else {
                unseenList.push(n);
            }
        }
        return { unseen: unseenList, seen: seenList };
    }, [notifications]);

    const hasAny = notifications.length > 0;

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                type="button"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 transition hover:bg-slate-100 cursor-pointer"
                title="Notifications"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && !isDemoUser && (
                <div
                    role="dialog"
                    aria-label="Notifications"
                    className="absolute right-0 mt-2 w-[22rem] sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-gray-800">Notifications</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {unreadCount > 0
                                    ? `${unreadCount} unread`
                                    : hasAny
                                        ? 'All caught up'
                                        : 'No alerts yet'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAll || unreadCount === 0}
                            className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                            {isMarkingAll ? 'Marking…' : 'Mark all as read'}
                        </button>
                    </div>

                    {/* Body */}
                    <div className="max-h-[28rem] overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-10 text-center text-sm text-gray-500">
                                Loading notifications…
                            </div>
                        ) : error ? (
                            <div className="px-4 py-10 text-center text-sm text-red-600">
                                {error}
                            </div>
                        ) : !hasAny ? (
                            <div className="px-4 py-10 text-center">
                                <div className="mx-auto h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-700">You're all caught up</p>
                                <p className="mt-1 text-xs text-gray-400">No parking alerts to show right now.</p>
                            </div>
                        ) : (
                            <>
                                {unseen.length > 0 && (
                                    <NotificationSection
                                        title="Unseen"
                                        count={unseen.length}
                                        items={unseen}
                                        onItemClick={handleMarkAsRead}
                                    />
                                )}
                                {seen.length > 0 && (
                                    <NotificationSection
                                        title="Seen"
                                        count={seen.length}
                                        items={seen}
                                        onItemClick={undefined}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function NotificationSection({ title, count, items, onItemClick }) {
    return (
        <div>
            <div className="px-4 pt-3 pb-2 flex items-center justify-between bg-slate-50/60 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {title}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">
                    {count}
                </span>
            </div>
            <ul className="divide-y divide-slate-100">
                {items.map((n) => (
                    <NotificationItem key={n.id} notification={n} onClick={onItemClick} />
                ))}
            </ul>
        </div>
    );
}

function NotificationItem({ notification, onClick }) {
    const style = getTypeStyle(notification.notification_type);
    const isUnseen = !notification.is_read;
    const timestamp = formatRelativeTime(notification.created_at);
    const absolute = formatAbsolute(notification.created_at);

    const handleClick = () => {
        if (isUnseen && onClick) {
            onClick(notification.id);
        }
    };

    return (
        <li>
            <button
                type="button"
                onClick={handleClick}
                disabled={!isUnseen || !onClick}
                className={`group w-full text-left px-4 py-3 flex gap-3 transition cursor-pointer ${isUnseen ? 'bg-blue-50/40 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'
                    } ${!isUnseen || !onClick ? 'cursor-default' : ''}`}
            >
                <div
                    className={`shrink-0 h-9 w-9 rounded-xl border flex items-center justify-center ${style.accent}`}
                    aria-hidden="true"
                >
                    {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${isUnseen ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>
                            {notification.title || 'Notification'}
                        </p>
                        {isUnseen && (
                            <span
                                aria-label="Unread"
                                className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-blue-600"
                            />
                        )}
                    </div>
                    {notification.message && (
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {notification.message}
                        </p>
                    )}
                    <p
                        className="mt-1.5 text-[10px] font-medium text-slate-400"
                        title={absolute}
                    >
                        {timestamp || absolute}
                    </p>
                </div>
            </button>
        </li>
    );
}
