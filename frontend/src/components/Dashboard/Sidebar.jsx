import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activePage }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = (e) => {
        e.preventDefault();
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            id: 'home',
            label: 'Home',
            to: '/dashboard/driver',
            icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5.5a1 1 0 01-1-1v-6.5h-4V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-10.5z" />
                </svg>
            )
        },
        {
            id: 'zones',
            label: 'Zones',
            to: '/dashboard/driver', // or appropriate route when built
            icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            )
        },
        {
            id: 'logs',
            label: 'Logs',
            to: '/dashboard/driver/logs',
            icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8M8 11h8M8 15h5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
            )
        },
        {
            id: 'profile',
            label: 'Profile',
            to: '/dashboard/driver/profile',
            icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20a8 8 0 0116 0" />
                </svg>
            )
        }
    ];

    return (
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-blue-700">
                    P
                </div>
                <span className="text-2xl font-semibold text-blue-700 font-sans tracking-tight">UniPark</span>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
                {navItems.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                        <Link
                            key={item.id}
                            to={item.to}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                isActive 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className={`flex h-5 w-5 items-center justify-center transition-colors ${
                                isActive ? 'text-blue-700' : 'text-slate-500'
                            }`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Support Box & Sign Out */}
            <div className="mt-auto pt-6 border-t border-slate-200">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 mb-5 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Support</p>
                    <p className="mt-1.5 text-xs text-slate-500 leading-normal">
                        Facing issues with a zone? Contact security.
                    </p>
                    <button type="button" className="mt-3 w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-2 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer shadow-sm">
                        Help Center
                    </button>
                </div>
                
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 text-left text-sm font-medium text-red-600 hover:text-red-700 transition cursor-pointer"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 17l5-5-5-5M15 12H3m11 9h7a2 2 0 002-2V5a2 2 0 00-2-2h-7" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
