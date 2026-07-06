import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_STORAGE_KEY = 'unipark_auth_tokens';
const USER_STORAGE_KEY = 'unipark_user';

/**
 * Reads the csrf_token cookie set by the backend CSRF middleware.
 * The cookie is NOT HttpOnly by design so JS can echo it in X-CSRF-Token.
 */
function getCsrfToken() {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf_token='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function toFrontendRole(role) {
    return role === 'security' ? 'guard' : role;
}

function toBackendRole(role) {
    return role === 'guard' ? 'security' : role;
}

function formatUser(apiUser) {
    const role = toFrontendRole(apiUser.role);
    return {
        id: apiUser.id,
        email: apiUser.email,
        role,
        name: `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim() || apiUser.email,
        phone: apiUser.phone_number || '',
        department: role === 'driver' ? 'Faculty of IT' : 'Security Command Centre',
        image: '',
    };
}

async function parseApiError(response) {
    try {
        const data = await response.json();
        return data.detail || data.message || 'Request failed';
    } catch {
        return 'Request failed';
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (!savedUser) {
            return;
        }

        try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setRole(parsedUser.role);
        } catch {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, []);

    const login = async (email, password, selectedRole) => {
        setIsLoading(true);
        setError(null);
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // login is CSRF-exempt on the backend (no cookie yet),
                    // but we attach if available for forward-compatibility
                    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const apiUser = await response.json();
            const userData = formatUser(apiUser);
            const expectedRole = toBackendRole(selectedRole);

            if (apiUser.role !== expectedRole) {
                throw new Error(`This account is registered as ${toFrontendRole(apiUser.role)}, not ${selectedRole}.`);
            }

            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            setUser(userData);
            setRole(userData.role);
            return userData;
        } catch (err) {
            // The previous implementation had a silent `getDemoUser()`
            // fallback here that signed the user in client-side even when
            // the real backend rejected the credentials. That left the UI
            // in a half-authed state (no JWT cookies set) and made every
            // subsequent API call fail with 401. We now surface the real
            // error to the form so the user can correct their password.
            const message = err.message || 'Login failed';
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async ({ fullName, email, password, phoneNumber, studentOrLecturerId, isLecturer }) => {
        setIsLoading(true);
        setError(null);

        try {
            const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
            const csrfToken = getCsrfToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // register is CSRF-exempt on the backend (pre-auth),
                    // but we attach if available for forward-compatibility
                    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                    role: 'driver',
                    first_name: firstName,
                    last_name: lastNameParts.join(' ') || firstName,
                    phone_number: phoneNumber,
                    student_or_lecturer_id: studentOrLecturerId,
                    is_lecturer: isLecturer,
                }),
            });

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            return response.json();
        } catch (err) {
            const message = err.message || 'Registration failed';
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            const csrfToken = getCsrfToken();
            await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
                },
            });
        } catch (e) {
            console.error('Logout request failed:', e);
        }
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setRole(null);
        setError(null);
    };

    const updateProfile = (profileData) => {
        setUser((prev) => {
            if (!prev) {
                return null;
            }

            const nextUser = { ...prev, ...profileData };
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
            return nextUser;
        });
    };

    const value = {
        user,
        role,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
