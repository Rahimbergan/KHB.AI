import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sun,
  Moon,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Wallet,
  ArrowDownLeft,
  Mail,
  Phone,
  Send,
  MapPin,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  Package
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { KhbLogo } from '../components/common/KhbLogo';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;
    setContactSent(true);
    setTimeout(() => {
      setContactName('');
      setContactPhone('');
      setContactMsg('');
      setContactSent(false);
    }, 4000);
  };

  // Bar Chart Data (matching user's uploaded dashboard style)
  const barData = [
    { month: 'Jan', val: 45 },
    { month: 'Feb', val: 58 },
    { month: 'Mar', val: 78 },
    { month: 'Apr', val: 52 },
    { month: 'May', val: 38 },
    { month: 'Jun', val: 55 },
    { month: 'Jul', val: 68 },
    { month: 'Aug', val: 96, isPeak: true },
    { month: 'Sep', val: 72 },
    { month: 'Oct', val: 60 },
    { month: 'Nov', val: 48 },
    { month: 'Dec', val: 64 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070a12] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-400 relative overflow-x-hidden">
      {/* Ambient Lighting & Minimal Subtle Grid */}
      <div className="ambient-glow opacity-70" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* 1. Header (Clean, Sticky Glassmorphism) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#070a12]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo (No v2.4 Live badge) */}
          <Link to="/" className="flex items-center gap-2.5">
            <KhbLogo variant="full" size="md" />
          </Link>

          {/* Navigation Links: Asosiy Sahifa, Biz haqimizda, Tariflar, FAQ, Kontaktlar */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-400">
            <a href="#home" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('navHome')}
            </a>
            <a href="#about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('navAbout')}
            </a>
            <a href="#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>{t('navPricing')}</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold">
                -20%
              </span>
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('navFaq')}
            </a>
            <a href="#contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('navContact')}
            </a>
          </nav>

          {/* Controls: Language, Theme, Auth CTAs */}
          <div className="flex items-center gap-3">
            <LanguageSelector />

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 cursor-pointer shadow-xs"
              >
                <span>{t('goToDashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {t('signIn')}
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <span>{t('heroPrimaryCta')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. ASOSIY SAHIFA (HERO & REAL SCREENSHOT SHOWCASE) */}
      <section id="home" className="pt-16 pb-16 sm:pt-24 sm:pb-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Core Hero Headline (No badge above) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            {t('landHeroTitle1')}
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">{t('landHeroTitle2')}</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('landHeroSub')}
          </p>

          {/* CTAs to Use the Platform */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35"
            >
              <span>{t('heroPrimaryCta')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/signin"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('heroDemoCta')}</span>
            </Link>
          </div>
        </div>

        {/* REAL PRODUCT UI SCREENSHOT SHOWCASE (Huddi yuklangan rasmdagidek) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14">
          <div className="p-4 sm:p-6 rounded-[36px] bg-gradient-to-b from-slate-100/80 to-slate-200/40 dark:from-slate-900/60 dark:to-[#070a12] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-sm">
            <div className="space-y-4">
              {/* Top Row: Two Cards (Mijozlar & Umumiy savdo) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left Card: Mijozlar Donut Chart */}
                <div className="md:col-span-4 p-6 sm:p-7 rounded-[28px] bg-white dark:bg-[#0e1320] border border-slate-100 dark:border-slate-800/80 shadow-md flex flex-col justify-between interactive-card">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t('mockCustomersTitle')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('mockCustomersSub')}
                    </p>
                  </div>

                  {/* Donut Visual */}
                  <div className="py-6 flex items-center justify-center">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="currentColor"
                          strokeWidth="11"
                          fill="transparent"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        {/* Vibrant Pink-Purple Gradient Arc */}
                        <defs>
                          <linearGradient id="customerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="url(#customerGrad)"
                          strokeWidth="11"
                          strokeDasharray="238.76"
                          strokeDashoffset="83.56"
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>

                      {/* Center Info */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                          65%
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                          {t('mockCustomersRate')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-radar" />
                    <span>Jonli kassa oqimi faol</span>
                  </div>
                </div>

                {/* Right Card: Umumiy savdo Bar Chart */}
                <div className="md:col-span-8 p-6 sm:p-7 rounded-[28px] bg-white dark:bg-[#0e1320] border border-slate-100 dark:border-slate-800/80 shadow-md flex flex-col justify-between interactive-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t('mockSalesTitle')}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t('mockSalesSub')}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100">
                      <span>{t('mockQuarterly')}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Monthly Bars Jan to Dec with highlighted Aug */}
                  <div className="pt-8 pb-3">
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-44">
                      {barData.map((item) => (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          {/* Peak badge on Aug */}
                          {item.isPeak && (
                            <div className="px-2 py-0.5 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-sm mb-1 animate-float">
                              <span className="text-emerald-400 dark:text-emerald-600">↗</span>
                              <span>{t('mockAugHighlight')}</span>
                            </div>
                          )}

                          {/* Bar */}
                          <div
                            style={{ height: `${item.val}%` }}
                            className={`w-full rounded-2xl transition-all duration-300 ${
                              item.isPeak
                                ? 'bg-emerald-500 dark:bg-emerald-500 shadow-md shadow-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          />

                          {/* Label */}
                          <span
                            className={`text-[10px] sm:text-xs font-medium ${
                              item.isPeak
                                ? 'text-slate-950 dark:text-white font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: 3 Circular KPI Chips (Kirim, Balans, Umumiy savdo) */}
              <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#0e1320] border border-slate-100 dark:border-slate-800/80 shadow-md grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x divide-slate-100 dark:divide-slate-800">
                {/* Chip 1: Kirim */}
                <div className="flex items-center gap-4 sm:px-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">
                      {t('mockIncomeLabel')}
                    </span>
                    <div className="text-2xl font-bold text-slate-950 dark:text-white">
                      $198k
                    </div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                      <span>↑</span> {t('mockIncomeChange')}
                    </span>
                  </div>
                </div>

                {/* Chip 2: Balans */}
                <div className="flex items-center gap-4 sm:px-6">
                  <div className="w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">
                      {t('mockBalanceLabel')}
                    </span>
                    <div className="text-2xl font-bold text-slate-950 dark:text-white">
                      $2.4k
                    </div>
                    <span className="text-xs font-medium text-rose-500 flex items-center gap-0.5 mt-0.5">
                      <span>↓</span> {t('mockBalanceChange')}
                    </span>
                  </div>
                </div>

                {/* Chip 3: Umumiy savdo */}
                <div className="flex items-center gap-4 sm:px-6">
                  <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">
                      {t('mockTotalSalesLabel')}
                    </span>
                    <div className="text-2xl font-bold text-slate-950 dark:text-white">
                      $89k
                    </div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                      <span>↑</span> {t('mockTotalSalesChange')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BIZ HAQIMIZDA (ABOUT US + KO'PROQ REAL RASMLAR / VISUAL MOCKUPS) */}
      <section id="about" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#090d16] relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {t('aboutTitle')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t('aboutSub')}
            </p>
          </div>

          {/* 3 ta real vizual UI screenshot bloklari */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visual Card 1: Zaxira ogohlantirish real mockupi */}
            <div className="p-6 rounded-[28px] bg-[#f8fafc] dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 space-y-5 flex flex-col justify-between interactive-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                    Kritik zaxira
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    {t('aboutCard1Title')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('aboutCard1Desc')}
                  </p>
                </div>

                {/* Real UI Mini Mockup */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">Xiaomi Robot Vacuum</span>
                    <span className="font-bold text-rose-500">2 dona qoldi</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[15%]" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>24 soatda tugaydi</span>
                    <span className="text-emerald-600 font-semibold">+12 dona buyurtma</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Card 2: Kassa tushumi va tovarlar tahlili */}
            <div className="p-6 rounded-[28px] bg-[#f8fafc] dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 space-y-5 flex flex-col justify-between interactive-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Bito POS Sync
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    {t('aboutCard2Title')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('aboutCard2Desc')}
                  </p>
                </div>

                {/* Real UI Mini Mockup */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Kunlik tushum</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">58 700 000 UZS</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">Apple Watch S9</span>
                    <span className="font-mono text-emerald-600 font-semibold">16.8M</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">Samsung Galaxy S24</span>
                    <span className="font-mono text-emerald-600 font-semibold">11.9M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Card 3: AI Tahlilchi qarori mockupi */}
            <div className="p-6 rounded-[28px] bg-[#f8fafc] dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 space-y-5 flex flex-col justify-between interactive-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    AI Qaror
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    {t('aboutCard3Title')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('aboutCard3Desc')}
                  </p>
                </div>

                {/* Real UI Mini Mockup */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2 shadow-xs">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-radar" />
                    <span>KHB AI Tahlili</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    "Samsung marjasi 16% dan 11% ga tushdi. Narxni to'g'rilash tavsiya etiladi."
                  </p>
                  <div className="text-[10px] text-emerald-600 font-semibold pt-1">
                    ✓ +5 400 000 UZS saqlanadi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TARIFLAR (FAQAT IKKITA TARIF: OYLIK VA YILLIK) */}
      <section id="pricing" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-slate-800/80 bg-[#f8fafc] dark:bg-[#070a12] relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {t('pricingTitle')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t('pricingSub')}
            </p>
          </div>

          {/* Ikkita Aniq Tarif Kartasi: Oylik va Yillik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tarif 1: Oylik ($16 / oyiga) */}
            <div className="p-8 sm:p-9 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between interactive-card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                    {t('pricingPlanMonthly')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('pricingPlanMonthlyDesc')}
                  </p>
                </div>

                {/* Price */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-950 dark:text-white font-mono">
                      {t('pricingMonthPrice')}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      {t('pricingMonthUnit')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-1.5">
                    Har oy to'lanadi, istalgan vaqtda bekor qilish mumkin
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3.5 pt-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature1')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature2')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature3')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature4')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature5')}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/signup"
                  className="w-full py-4 rounded-2xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t('pricingChoosePlan')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Tarif 2: Yillik ($160 / yiliga - 20% chegirma) */}
            <div className="p-8 sm:p-9 rounded-[32px] bg-white dark:bg-[#0e1320] border-2 border-emerald-500 dark:border-emerald-500/80 shadow-xl relative flex flex-col justify-between interactive-card">
              <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-sm uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>20% chegirma bilan</span>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                    {t('pricingPlanYearly')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('pricingPlanYearlyDesc')}
                  </p>
                </div>

                {/* Price */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-950 dark:text-white font-mono">
                      {t('pricingYearPrice')}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      {t('pricingYearUnit')}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mt-1.5">
                    ✓ {t('pricingYearSaveNote')}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3.5 pt-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature1')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature2')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature3')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature4')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeature5')}</span>
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-emerald-700 dark:text-emerald-400">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t('pricingFeatureYearlyBonus')}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/signup"
                  className="w-full py-4 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <span>{t('pricingChoosePlan')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ (TEZ-TEZ BERILADIGAN SAVOLLAR) */}
      <section id="faq" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#090d16] relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {t('faqTitle')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t('faqSub')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              { q: t('faqQ1'), a: t('faqA1') },
              { q: t('faqQ2'), a: t('faqA2') },
              { q: t('faqQ3'), a: t('faqA3') },
              { q: t('faqQ4'), a: t('faqA4') },
            ].map((faqItem, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0e1320] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                    {faqItem.q}
                  </span>
                  <span className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500 shrink-0">
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-6 sm:px-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                    {faqItem.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. KONTAKTLAR (TELEFON: +99894094002) */}
      <section id="contact" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-slate-800/80 bg-[#f8fafc] dark:bg-[#070a12] relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {t('contactTitle')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t('contactSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct Info Cards */}
            <div className="md:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 interactive-card">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">{t('contactPhoneLabel')}</span>
                  <a href="tel:+99894094002" className="text-base font-bold text-slate-900 dark:text-white hover:underline">
                    +99894094002
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 interactive-card">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">{t('contactTelegramLabel')}</span>
                  <a href="https://t.me/khb_support" target="_blank" rel="noreferrer" className="text-base font-bold text-slate-900 dark:text-white hover:underline">
                    @khb_support
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 interactive-card">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">{t('contactEmailLabel')}</span>
                  <a href="mailto:support@khb.ai" className="text-base font-bold text-slate-900 dark:text-white hover:underline">
                    support@khb.ai
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 interactive-card">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">{t('contactAddressLabel')}</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {t('contactAddressVal')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Quick Message Form */}
            <div className="md:col-span-7 p-8 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 shadow-md">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-2">
                  Xabar yuborish
                </h3>

                {contactSent && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    ✓ {t('contactFormSuccess')}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('contactFormName')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alisher Usmonov"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('contactFormPhone')}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 94 094 00 02"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('contactFormMsg')}
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Do'konimni KHB ga ulash bo'yicha maslahat olmoqchiman..."
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('contactFormSubmit')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TO'LIQ FOOTER (TELEFON: +99894094002) */}
      <footer className="mt-auto py-12 px-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070a12] text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Column 1: Brand */}
            <div className="md:col-span-5 space-y-3">
              <KhbLogo variant="full" size="md" />
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                {t('footerDesc')}
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                © 2026 KHB.ai. {t('footerRights')}
              </div>
            </div>

            {/* Column 2: Navigatsiya */}
            <div className="md:col-span-3 space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                {t('footerNavProduct')}
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#home" className="hover:text-slate-900 dark:hover:text-white transition">
                    {t('navHome')}
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-slate-900 dark:hover:text-white transition">
                    {t('navAbout')}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition">
                    {t('navPricing')}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition">
                    {t('navFaq')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Bog'lanish */}
            <div className="md:col-span-4 space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                {t('navContact')}
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="tel:+99894094002" className="hover:text-slate-900 dark:hover:text-white transition">
                    +99894094002
                  </a>
                </li>
                <li>
                  <a href="mailto:support@khb.ai" className="hover:text-slate-900 dark:hover:text-white transition">
                    support@khb.ai
                  </a>
                </li>
                <li>
                  <a href="https://t.me/khb_support" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition">
                    Telegram: @khb_support
                  </a>
                </li>
                <li className="text-slate-400 pt-1">
                  {t('contactAddressVal')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
