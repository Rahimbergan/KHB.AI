import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Sparkles,
  Globe,
  Store,
  CheckCircle2,
  ChevronRight,
  User,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { KhbLogo } from './KhbLogo';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { to: '/sales', label: t('navSales'), icon: ShoppingCart },
    { to: '/documents', label: t('navDocuments'), icon: FileText },
    { to: '/chat', label: t('navChat'), icon: Sparkles },
  ];

  return (
    <aside
      className="w-68 shrink-0 h-screen sticky top-0 select-none z-20 flex flex-col justify-between transition-colors duration-200 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70 space-y-3">
          <Link to="/landing" className="flex items-center gap-2.5 group">
            <KhbLogo variant="full" size="md" />
          </Link>

          {/* Do'kon Paneli Selector Badge */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                  {t('storePanelTitle')}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                  {t('businessName')}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-radar shrink-0" />
          </div>
        </div>

        {/* Navigation Items (4 Main Sections) */}
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Bo'limlar
            </span>
            <nav className="space-y-1.5 pt-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-emerald-600 dark:text-emerald-400" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Quick link to Landing */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tashqi sahifa
            </span>
            <NavLink
              to="/landing"
              className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              <Globe className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{t('navLanding')}</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Footer: User & Store Account Card */}
      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'KH'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                {user?.name || 'Alisher Usmonov'}
              </span>
              <span className="text-[10px] text-slate-400 truncate block">
                {user?.email || 'admin@khb.ai'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Bito POS
            </span>
            <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              Yillik $160
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
