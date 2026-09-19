import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Wallet,
  ArrowDownLeft,
  Sparkles,
  AlertTriangle,
  Clock,
  ChevronDown,
  Store,
  CheckCircle2,
  Package,
  Activity,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeRange, setActiveRange] = useState<'quarterly' | 'monthly'>('quarterly');

  // Bar Chart Data (matching user's uploaded visual style)
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

  // Top Products from live Bito ledger
  const topProducts = [
    { name: "Apple Watch Series 9 45mm", units: 3, revenue: "16 800 000 UZS", margin: "19.4%", status: "Sotuvda faol" },
    { name: "Xiaomi Robot Vacuum S10+", units: 3, revenue: "12 600 000 UZS", margin: "16.2%", status: "Kritik zaxira" },
    { name: "Samsung Galaxy S24 256GB", units: 1, revenue: "11 900 000 UZS", margin: "11.2%", status: "Marja pasaygan" },
    { name: "Lenovo ThinkPad E14 Gen 5", units: 1, revenue: "9 900 000 UZS", margin: "22.8%", status: "Sotuvda faol" },
    { name: "Dell 27-inch 4K UHD Monitor", units: 1, revenue: "5 100 000 UZS", margin: "18.5%", status: "Sotuvda faol" },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* 1. Page Header (Do'kon Paneli) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {t('storePanelTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-radar" />
              Jonli kassa
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>{t('businessName')}</span>
            <span>•</span>
            <span>{t('contextDate')}</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bito POS sinxronlangan</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tahlilchidan so'rash</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 3 COHESIVE KPI CARDS (Platformaning rasmiy yashil palitrasi) */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x divide-slate-100 dark:divide-slate-800">
        {/* Chip 1: Kirim */}
        <div className="flex items-center gap-4 sm:px-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t('mockIncomeLabel')}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              $198k
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <span>↑</span> {t('mockIncomeChange')}
            </span>
          </div>
        </div>

        {/* Chip 2: Balans */}
        <div className="flex items-center gap-4 sm:px-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t('mockBalanceLabel')}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              $2.4k
            </div>
            <span className="text-xs font-medium text-rose-500 flex items-center gap-0.5 mt-0.5">
              <span>↓</span> {t('mockBalanceChange')}
            </span>
          </div>
        </div>

        {/* Chip 3: Umumiy savdo */}
        <div className="flex items-center gap-4 sm:px-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t('mockTotalSalesLabel')}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              $89k
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <span>↑</span> {t('mockTotalSalesChange')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: TWO VISUAL CARDS (Mijozlar Donut & Umumiy savdo Bar Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Card: Mijozlar Donut Chart */}
        <div className="md:col-span-4 p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between interactive-card">
          <div>
            <h3 className="text-xl font-bold text-slate-950 dark:text-white">
              {t('mockCustomersTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('mockCustomersSub')}
            </p>
          </div>

          {/* Donut Visual (Platform Green / Emerald Palette) */}
          <div className="py-6 flex items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="11"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <defs>
                  <linearGradient id="panelCustomerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="url(#panelCustomerGrad)"
                  strokeWidth="11"
                  strokeDasharray="238.76"
                  strokeDashoffset="83.56"
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                  65%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                  {t('mockCustomersRate')}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown tags */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Yangi xaridorlar: <b className="text-slate-900 dark:text-white">65%</b></span>
            <span className="text-slate-500 dark:text-slate-400">Doimiy: <b className="text-slate-900 dark:text-white">35%</b></span>
          </div>
        </div>

        {/* Right Card: Umumiy savdo Bar Chart */}
        <div className="md:col-span-8 p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between interactive-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">
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

          {/* Monthly Bars Jan to Dec */}
          <div className="pt-8 pb-2">
            <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-44">
              {barData.map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {item.isPeak && (
                    <div className="px-2 py-0.5 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-sm mb-1 animate-float">
                      <span className="text-emerald-500">↗</span>
                      <span>{t('mockAugHighlight')}</span>
                    </div>
                  )}

                  <div
                    style={{ height: `${item.val}%` }}
                    className={`w-full rounded-2xl transition-all duration-300 ${
                      item.isPeak
                        ? 'bg-emerald-500 dark:bg-emerald-500 shadow-md shadow-emerald-500/25'
                        : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  />

                  <span
                    className={`text-[10px] sm:text-xs font-medium ${
                      item.isPeak
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
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

      {/* 4. ACTION MOCKUPS (Kritik Zaxira & AI Tavsiyalar - Yagona toza dizayn) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Kritik Zaxira Signali */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-4 interactive-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Zaxira inqirozi xavfi
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Xiaomi Robot Vacuum X10
                </h4>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
              2 dona qoldi
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Haftalik sotuv sur'ati bo'yicha qoldiq 24 soatda tugaydi. Kutilayotgan yo'qotish: <b>-14 200 000 UZS</b>.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              ✓ Tavsiya: Zudlik bilan 12 dona buyurtma berish
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 cursor-pointer whitespace-nowrap shadow-xs"
            >
              Buyurtma
            </button>
          </div>
        </div>

        {/* Card 2: AI Diagnostika Xulosasi */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-4 interactive-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  AI Tahlilchi xulosasi
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Rentabellik o'zgarishi
                </h4>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              Marja 11.2%
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Samsung Galaxy narxi tannarxga nisbatan pasaygan. Narx siyosatini 12 400 000 UZS ga to'g'rilash orqali har oy <b>+5.4M UZS</b> saqlab qolinadi.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Batafsil tahlil va simulyatsiyani ko'rish
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-850 transition active:scale-95 cursor-pointer whitespace-nowrap shadow-xs"
            >
              Ochish
            </button>
          </div>
        </div>
      </div>

      {/* 5. LIVE BITO POS SALES TABLE (Sof, zamonaviy ro'yxat) */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-5 interactive-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              Bito POS • Bugungi xaridlar oqimi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              58 700 000 UZS jami tushum (5 ta chek)
            </p>
          </div>
          <button
            onClick={() => navigate('/sales')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Barcha savdolar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3">Mahsulot</th>
                <th className="pb-3 text-center">Soni</th>
                <th className="pb-3 text-right">Tushum</th>
                <th className="pb-3 text-right">Marja</th>
                <th className="pb-3 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {topProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                  <td className="py-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {p.units} dona
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {p.revenue}
                  </td>
                  <td className="py-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {p.margin}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.status === 'Kritik zaxira'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                          : p.status === 'Marja pasaygan'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.status === 'Kritik zaxira' ? 'bg-amber-500' : p.status === 'Marja pasaygan' ? 'bg-slate-400' : 'bg-emerald-500'
                      }`} />
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
