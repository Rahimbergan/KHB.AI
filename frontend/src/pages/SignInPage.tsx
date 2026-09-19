import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/common/LanguageSelector';

import { KhbLogo } from '../components/common/KhbLogo';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = signIn(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error ? t('authSignInError') : t('authSignInError'));
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
      <div className="w-full max-w-md mx-auto px-6 py-8">
        <div
          className="p-8 rounded-3xl border shadow-2xl space-y-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Header text */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              {t('authSignInTitle')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              {t('authSignInSub')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('authPassLabel')}
                </label>
                <span className="text-[11px] text-emerald-400 hover:underline cursor-pointer">
                  {t('authForgotPass')}
                </span>
              </div>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border focus-within:border-emerald-500 transition"
                style={{ backgroundColor: 'var(--bg-card-inner)', borderColor: 'var(--border-color)' }}
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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
                  <span>{t('authSignInBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Tip / Hint for Demo */}
          <div className="p-3 rounded-xl border text-[11px] font-mono leading-relaxed" style={{ backgroundColor: 'var(--bg-card-inner)', borderColor: 'var(--border-color)', color: 'var(--text-subtle)' }}>
            <span className="text-emerald-400 font-bold block mb-0.5">// Demo:</span>
            <span>{t('authDemoNote')}</span>
          </div>

          {/* Footer Link to Sign Up */}
          <div className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
            {t('authNoAccount')}{' '}
            <Link to="/signup" className="text-emerald-400 font-semibold hover:underline">
              {t('signUp')}
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
