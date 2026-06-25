import { Link, useLocation } from 'react-router-dom';
import { MapPin, BarChart2, User, Plus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const { pathname } = useLocation();

  const navLinks = [
    { to: '/', icon: <MapPin size={18} />, label: 'Map' },
    { to: '/dashboard', icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { to: '/profile', icon: <User size={18} />, label: 'Profile' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-orange-500 font-bold text-xl">Nagar</span>
          <span className="text-blue-400 font-bold text-xl">AI</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === to
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        {/* Auth + Report CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/report"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Report</span>
              </Link>
              <button onClick={logout}>
                <img
                  src={user.photoURL ?? ''}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border-2 border-slate-700 hover:border-orange-500 transition-colors cursor-pointer"
                />
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
