import React, { useState, useRef, useEffect } from 'react';
import { Calendar, User, Sun, Moon, LogOut, Globe, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface Props {
  dateRange?: string;
  setDateRange?: (range: string) => void;
  onOpenCommand?: () => void;
}

export const Header: React.FC<Props> = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header
      className="h-16 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border-color)' }}
    >
      {/* Left side spacer */}
      <div className="flex items-center gap-2"></div>

      {/* Center: Context Date & Seeded Period Badge */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{t('contextDate')}</span>
          <Calendar className="w-3.5 h-3.5 opacity-40 ml-1 cursor-pointer" />
        </div>
        <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-subtle)' }}>
          {t('seededPeriod')}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Selector (UZ / EN / RU) */}
        <LanguageSelector />

        {/* Quick Link to Landing Page */}
        <Link
          to="/landing"
          title={t('landingBtn')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer hover:border-emerald-500/50"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-main)'
          }}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">{t('landingBtn')}</span>
        </Link>

        {/* Local Bito Replica pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border emerald-badge cursor-default">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">{t('localBitoReplica')}</span>
          <span className="sm:hidden">Replica</span>
        </div>

        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-2 rounded-full border transition cursor-pointer"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 hover:text-indigo-600" />
          )}
        </button>

        {/* User Profile Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            title="User Profile & Account"
            className="w-8 h-8 rounded-full border flex items-center justify-center transition cursor-pointer hover:border-emerald-500/50"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <User className="w-4 h-4" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 p-2 rounded-2xl border shadow-2xl z-50 animate-in fade-in duration-150 text-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
            >
              {/* Profile Details */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="font-bold truncate" style={{ color: 'var(--text-main)' }}>
                  {user?.name || t('appName')}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.email || 'admin@khb.ai'}
                </div>
                <div className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-md emerald-badge font-medium">
                  {user?.role || 'Business Owner'}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1 space-y-0.5">
                <Link
                  to="/landing"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                  <span>{t('landingBtn')}</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('signOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
