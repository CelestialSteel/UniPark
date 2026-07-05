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
};