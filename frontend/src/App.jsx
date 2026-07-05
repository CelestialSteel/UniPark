import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import DriverDashboard from './components/Dashboard/DriverDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import SecurityDashboard from './components/Dashboard/SecurityDashboard';
import './index.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/dashboard/driver" element={<DriverDashboard defaultTab="home" />} />
                    <Route path="/dashboard/driver/profile" element={<DriverDashboard defaultTab="profile" />} />
                    <Route path="/dashboard/driver/logs" element={<DriverDashboard defaultTab="logs" />} />
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                    <Route path="/dashboard/guard" element={<SecurityDashboard />} />
                    {/* Dashboard routes will be added later */}
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
