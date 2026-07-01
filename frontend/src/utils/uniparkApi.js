const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_STORAGE_KEY = 'unipark_auth_tokens';

function getAccessToken() {
    try {
        const rawTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!rawTokens) {
            return null;
        }

        const parsedTokens = JSON.parse(rawTokens);
        return parsedTokens.access_token || null;
    } catch {
        return null;
    }
}

async function parseError(response) {
    try {
        const payload = await response.json();
        return payload.detail || payload.message || 'Request failed';
    } catch {
        return 'Request failed';
    }
}

export async function requestJson(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = getAccessToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
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
    getZoneOccupancy: () => requestJson('/api/v1/zones/occupancy'),
    getVehicleLogs: () => requestJson('/api/v1/logs'),
    getInfringements: () => requestJson('/api/v1/infringements'),
    updateInfringement: (id, payload) => requestJson(`/api/v1/infringements/${id}`, { method: 'PATCH', body: payload }),
};