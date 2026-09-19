import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/common/LanguageSelector';

import { KhbLogo } from '../components/common/KhbLogo';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('authPassMismatch'));
      return;
    }

    setLoading(true);

    try {
      const result = signUp(name, email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error ? t('authSignUpError') : t('authSignUpError'));
      }
    } catch {
      setError(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      {/* Top Bar */}
      <div className="p-6 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <KhbLogo variant="full" size="md" />
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="p-2 rounded-full border transition cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Form Center Card */}
      <div className="w-full max-w-md mx-auto px-6 py-6">
        <div
          className="p-8 rounded-3xl border shadow-2xl space-y-5"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Header text */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              {t('authSignUpTitle')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              {t('authSignUpSub')}
            </p>
          </div>

          {/* Instant access note */}
          <div className="p-3 rounded-xl border emerald-badge flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{t('authInstantNotice')}</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Business / Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('authNameLabel')}
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border focus-within:border-emerald-500 transition"
                style={{ backgroundColor: 'var(--bg-card-inner)', borderColor: 'var(--border-color)' }}
              >
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder={t('authNamePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-slate-500"
                  style={{ color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* Gmail / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('authEmailLabel')}
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border focus-within:border-emerald-500 transition"
                style={{ backgroundColor: 'var(--bg-card-inner)', borderColor: 'var(--border-color)' }}
              >
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder={t('authEmailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-slate-500"
                  style={{ color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('authPassLabel')}
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border focus-within:border-emerald-500 transition"
                style={{ backgroundColor: 'var(--bg-card-inner)', borderColor: 'var(--border-color)' }}
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('authPassPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-slate-500"
                  style={{ color: 'var(--text-main)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('authConfirmPassLabel')}
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border focus-within:border-emerald-500 transition"
                style={{ backgroundColor: 'var(--bg-card-inner)', borderColor: 'var(--border-color)' }}
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('authConfirmPassPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-slate-500"
                  style={{ color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{t('authSignUpBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link to Sign In */}
          <div className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
            {t('authHasAccount')}{' '}
            <Link to="/signin" className="text-emerald-400 font-semibold hover:underline">
              {t('signIn')}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom link back */}
      <div className="py-6 text-center text-xs" style={{ color: 'var(--text-subtle)' }}>
        <Link to="/" className="hover:underline">
          {t('authBackHome')}
        </Link>
      </div>
    </div>
  );
};
