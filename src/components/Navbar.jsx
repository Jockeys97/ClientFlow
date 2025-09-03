import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDataStore } from '../store/useDataStore.js';
import { authService } from '../services/auth.js';

export default function Navbar({ onLogout }) {
  const darkModeEnabled = useDataStore((s) => s.darkModeEnabled);
  const toggleDarkMode = useDataStore((s) => s.toggleDarkMode);
  const user = authService.getUser();
  
  const handleLogout = () => {
    authService.logout();
    if (onLogout) onLogout();
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium nav-underline ${
      isActive ? 'text-reply-800' : 'hover:text-reply-700'
    }`;

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="font-semibold tracking-wide">Consulting Dashboard</div>
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" className={linkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/clients" className={linkClass}>
              Clienti
            </NavLink>
            <NavLink to="/projects" className={linkClass}>
              Progetti
            </NavLink>
            <NavLink to="/tickets" className={linkClass}>
              Ticket
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Ciao, {user?.name}</span>
            {user?.role && (
              <span className="px-2 py-1 text-xs bg-reply-100 dark:bg-reply-900/40 text-reply-800 dark:text-reply-200 rounded">
                {user.role}
              </span>
            )}
          </div>
          <button
            aria-label="Toggle dark mode"
            className="px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleDarkMode}
          >
            {darkModeEnabled ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}


