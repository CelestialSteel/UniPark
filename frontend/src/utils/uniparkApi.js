const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Reads the `csrf_token` cookie set by the backend CSRF middleware.
 * The cookie is intentionally NOT HttpOnly so JavaScript can read it
 * and echo it back in the X-CSRF-Token header (double-submit pattern).
 */
function getCsrfToken() {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf_token='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

async function parseError(response) {
    try {
        const payload = await response.json();
        return payload.detail || payload.message || 'Request failed';
    } catch {
        return 'Request failed';
    }
}

export async function requestJson(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    // Attach the CSRF token for all state-changing requests
    if (method !== 'GET' && method !== 'HEAD') {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(await parseError(response));
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}


export const uniparkApi = {
    getDriverProfile: () => requestJson('/api/v1/drivers/profile'),
    updateDriverProfile: (payload) => requestJson('/api/v1/drivers/profile', { method: 'PATCH', body: payload }),
    getDriverVehicles: () => requestJson('/api/v1/drivers/vehicles'),
    unlinkDriverVehicle: (vehicleId, payload) => requestJson(`/api/v1/vehicles/${vehicleId}/unlink`, { method: 'POST', body: payload }),
    getDriverLogs: (params = {}) => {
        const query = new URLSearchParams();
        if (params.skip !== undefined) {
            query.set('skip', String(params.skip));
        }
        if (params.limit !== undefined) {
            query.set('limit', String(params.limit));
        }
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return requestJson(`/api/v1/drivers/logs${suffix}`);
    },
    updateDriverPassword: (payload) => requestJson('/api/v1/drivers/password', { method: 'PATCH', body: payload }),
    getZoneOccupancy: () => requestJson('/api/v1/zones/occupancy'),
    getVehicleLogs: () => requestJson('/api/v1/logs'),
    createZone: (payload) => requestJson('/api/v1/zones', { method: 'POST', body: payload }),
    updateZone: (id, payload) => requestJson(`/api/v1/zones/${id}`, { method: 'PATCH', body: payload }),
    createSpaceReservation: (id, payload) => requestJson(`/api/v1/spaces/${id}/reserve`, { method: 'POST', body: payload }),
    createSpaceCordone: (id, payload) => requestJson(`/api/v1/spaces/${id}/cordone`, { method: 'POST', body: payload }),
    getAnalyticsDashboard: () => requestJson('/api/v1/analytics/dashboard'),

    // Guard Management API methods
    getGuards: () => requestJson('/api/v1/users?role=security'),
    addGuard: (payload) => requestJson('/api/v1/auth/register', { method: 'POST', body: { ...payload, role: 'security' } }),
    updateGuard: (id, payload) => requestJson(`/api/v1/users/${id}`, { method: 'PATCH', body: payload }),
    deleteGuard: (id) => requestJson(`/api/v1/users/${id}`, { method: 'DELETE' }),

    // Password reset (pre-auth — no CSRF token required)
    forgotPassword: (email) =>
        requestJson('/api/v1/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (token, newPassword) =>
        requestJson('/api/v1/auth/reset-password', {
            method: 'POST',
            body: { token, new_password: newPassword },
        }),

    // Security: vehicle directory + driver lookup + gate linking
    getAllVehicles: (params = {}) => {
        const query = new URLSearchParams();
        if (params.skip) {
            query.set('skip', String(params.skip));
        }
        if (params.limit) {
            query.set('limit', String(params.limit));
        }
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return requestJson(`/api/v1/vehicles${suffix}`);
    },
    lookupDriverByAdmission: (admissionId) =>
        requestJson(`/api/v1/drivers/by-admission/${encodeURIComponent(admissionId)}`),
    adminLinkVehicle: (payload) =>
        requestJson('/api/v1/vehicles/admin-link', { method: 'POST', body: payload }),

    // Notification API methods
    getNotifications: ({ unreadOnly = false, skip = 0, limit = 20 } = {}) => {
        const query = new URLSearchParams();
        if (unreadOnly) {
            query.set('unread_only', 'true');
        }
        if (skip) {
            query.set('skip', String(skip));
        }
        query.set('limit', String(limit));
        return requestJson(`/api/v1/notifications?${query.toString()}`);
    },
    getUnreadNotificationCount: () => requestJson('/api/v1/notifications/unread-count'),
    markNotificationAsRead: (id) => requestJson(`/api/v1/notifications/${id}/mark-as-read`, { method: 'POST' }),
    markAllNotificationsAsRead: () => requestJson('/api/v1/notifications/mark-all-as-read', { method: 'POST' }),

    // Security gate: live entry/exit log
    getActiveLogs: (limit = 200) =>
        requestJson(`/api/v1/logs/active?limit=${limit}`),
    logVehicleEntry: (payload) =>
        requestJson('/api/v1/logs/entry', { method: 'POST', body: payload }),
    logVehicleExit: (payload) =>
        requestJson('/api/v1/logs/exit', { method: 'POST', body: payload }),

    // Admin: zone cordon / release
    cordonZone: (zoneId) =>
        requestJson(`/api/v1/zones/${zoneId}/cordone`, { method: 'POST' }),
    releaseZone: (zoneId) =>
        requestJson(`/api/v1/zones/${zoneId}/release`, { method: 'POST' }),

    // Admin: zone-level bulk event reservations
    bulkReserveZone: (zoneId, { eventName, numSpaces, eventDate } = {}) => {
        const params = new URLSearchParams();
        params.set('event_name', eventName || 'Event Reservation');
        params.set('num_spaces', String(numSpaces || 5));
        if (eventDate) params.set('event_date', eventDate);
        return requestJson(`/api/v1/zones/${zoneId}/reserve?${params.toString()}`, { method: 'POST' });
    },

    // Admin: list + cancel individual space reservations
    getReservations: () => requestJson('/api/v1/spaces/reservations'),
    cancelReservation: (spaceId) =>
        requestJson(`/api/v1/spaces/reservations/${spaceId}`, { method: 'DELETE' }),

    // Admin: alerts (announcements)
    getAlerts: () => requestJson('/api/v1/alerts'),
    createAlert: (payload) =>
        requestJson('/api/v1/alerts', { method: 'POST', body: payload }),
    resolveAlert: (alertId, notes = 'Dismissed by admin') =>
        requestJson(`/api/v1/alerts/${alertId}/resolve?resolution_notes=${encodeURIComponent(notes)}`, { method: 'PATCH' }),

    // Admin: driver lookup by plate (returns full driver profile + vehicles
    // + current parking status + recent history in a single round-trip).
    lookupByPlate: (plate) => {
        const params = new URLSearchParams({ plate });
        return requestJson(`/api/v1/drivers/lookup?${params.toString()}`);
    },

    // Security: quick driver contact card (name/email/phone/department)
    // for the "Contact Driver" tab — no history, no vehicle list.
    contactLookupByPlate: (plate) => {
        const params = new URLSearchParams({ plate });
        return requestJson(`/api/v1/drivers/contact-lookup?${params.toString()}`);
    },

    // Security: dispatch a quick alert to the driver of a plate.
    contactDriver: (payload) =>
        requestJson('/api/v1/notifications/contact-driver', {
            method: 'POST',
            body: payload,
        }),
};
