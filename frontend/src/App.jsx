import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import DriverHomePage from './components/Dashboard/DriverHomePage';
import DriverProfilePage from './components/Dashboard/DriverProfilePage';
import DriverLogsPage from './components/Dashboard/DriverLogsPage';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import './index.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/dashboard/driver" element={<DriverHomePage />} />
                    <Route path="/dashboard/driver/profile" element={<DriverProfilePage />} />
                    <Route path="/dashboard/driver/logs" element={<DriverLogsPage />} />
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                    {/* Dashboard routes will be added later */}
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
