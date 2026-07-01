import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_STORAGE_KEY = 'unipark_auth_tokens';
const USER_STORAGE_KEY = 'unipark_user';

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

function getDemoUser(email, password, selectedRole) {
    const demoUsers = {
        driver: {
            email: '12345',
            password: '12345678',
            name: 'Dalton Muindi',
            phone: '+254 712 345678',
            department: 'Faculty of IT',
        },
        guard: {
            email: 'guard@unipark.ac.ke',
            password: 'guard123',
            name: 'Security Guard',
            phone: '+254 722 987654',
            department: 'Security Command Centre',
        },
        admin: {
            email: 'admin@unipark.ac.ke',
            password: 'admin123',
            name: 'Admin Administrator',
            phone: '+254 722 987654',
            department: 'Security Command Centre',
        },
    };

    const demo = demoUsers[selectedRole];
    if (!demo || demo.email !== email || demo.password !== password) {
        return null;
    }

    return {
        id: `demo-${selectedRole}`,
        email,
        role: selectedRole,
        name: demo.name,
        phone: demo.phone,
        department: demo.department,
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
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    }, []);

    const login = async (email, password, selectedRole) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const tokens = await response.json();
            const profileResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });

            if (!profileResponse.ok) {
                throw new Error(await parseApiError(profileResponse));
            }

            const apiUser = await profileResponse.json();
            const userData = formatUser(apiUser);
            const expectedRole = toBackendRole(selectedRole);

            if (apiUser.role !== expectedRole) {
                throw new Error(`This account is registered as ${toFrontendRole(apiUser.role)}, not ${selectedRole}.`);
            }

            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            setUser(userData);
            setRole(userData.role);
            return userData;
        } catch (err) {
            const demoUser = getDemoUser(email, password, selectedRole);
            if (demoUser) {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
                setUser(demoUser);
                setRole(demoUser.role);
                return demoUser;
            }

            const message = err.message || 'Login failed';
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async ({ fullName, email, password, phoneNumber }) => {
        setIsLoading(true);
        setError(null);

        try {
            const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    role: 'driver',
                    first_name: firstName,
                    last_name: lastNameParts.join(' ') || firstName,
                    phone_number: phoneNumber,
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

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
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
