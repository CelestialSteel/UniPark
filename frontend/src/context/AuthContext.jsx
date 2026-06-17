import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email, password, selectedRole) => {
        setIsLoading(true);
        setError(null);
        try {
            // Mock API call - replace with real API when backend is ready
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const isTestDriverLogin = email === '12345' && password === '12345678';

            // Mock validation
            if (isTestDriverLogin || (email && password)) {
                const userData = {
                    id: Math.random().toString(36).substr(2, 9),
                    email,
                    role: isTestDriverLogin ? 'driver' : selectedRole,
                };
                setUser(userData);
                setRole(isTestDriverLogin ? 'driver' : selectedRole);
                return userData;
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        setError(null);
    };

    const value = {
        user,
        role,
        isLoading,
        error,
        login,
        logout,
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
