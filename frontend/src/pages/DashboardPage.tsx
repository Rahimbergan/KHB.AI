import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  FileText,
  Boxes,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getDailySales } from '../api/dashboard';
import { runSalesAnalysis, getInventory, getSales } from '../api/sales';
import { ChartArtifact } from '../components/artifacts/ChartArtifact';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState<'today' | '7d' | '30d'>('30d');
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    data: daily,
    isLoading: dailyLoading,
    isError: dailyError,
    error: dailyErrObj,
    refetch: refetchDaily
  } = useQuery({
    queryKey: ['dailySales', todayStr],
    queryFn: () => getDailySales(todayStr),
  });

  const {
    data: analysis,
    isLoading: analysisLoading,
    isError: analysisError,
    error: analysisErrObj,
    refetch: refetchAnalysis
  } = useQuery({
    queryKey: ['salesAnalysisDashboard', activeRange],
    queryFn: () => {
      const today = new Date();
      const daysBack = activeRange === 'today' ? 1 : activeRange === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(today.getDate() - daysBack);
      return runSalesAnalysis({
        from: startDate.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      });
    },
  });

  const {
    data: inventoryData,
    isLoading: inventoryLoading
  } = useQuery({
    queryKey: ['inventoryDashboard'],
    queryFn: () => getInventory(),
  });

  const { data: recentSalesData } = useQuery({
    queryKey: ['recentSalesDashboard'],
    queryFn: () => getSales({ page: 1, page_size: 6 }),
  });

  if (dailyLoading || analysisLoading || inventoryLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <div className="text-xs font-semibold text-slate-300">Biznes ko'rsatkichlari yuklanmoqda...</div>
        <div className="text-[11px] text-slate-500">Bito Local API bilan sinxronlanmoqda</div>
      </div>
    );
  }

  if (dailyError || analysisError) {
    const errMsg = (dailyErrObj as any)?.message || (analysisErrObj as any)?.message || "Ma'lumotlarni yuklab bo'lmadi";
    return (
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-rose-900/40 text-center max-w-lg mx-auto my-16 space-y-4 shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Backend bilan bog'lanishda xatolik</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{errMsg}</p>
        </div>
        <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono text-left space-y-1">
          <div className="text-slate-500">// Backendni tekshiring:</div>
          <div>cd backend &amp;&amp; python run.py</div>
        </div>
        <button
          onClick={() => { refetchDaily(); refetchAnalysis(); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Qayta ulanish
        </button>
      </div>
    );
  }

  const inventory = inventoryData?.data || [];
  const lowStockItems = inventory.filter(i => i.is_low_stock || i.current_stock <= i.min_stock_threshold);
  const recentSales = recentSalesData?.data || [];

  const kpis = [
    {
      title: "Bugungi kassa tushumi",
      value: `${(daily?.total_revenue ?? 0).toLocaleString()} ${daily?.currency || 'UZS'}`,
      badge: "+18.2%",
      badgeUp: true,
      sub: `Tannarx: ${(daily?.total_cost ?? 0).toLocaleString()} UZS`,
      icon: DollarSign,
      glow: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
    },
    {
      title: "Buyurtmalar oqimi",
      value: `${daily?.orders_count ?? 0} ta`,
      badge: `${daily?.total_units_sold ?? 0} dona tovar`,
      badgeUp: true,
      sub: `Qaytarilgan: ${daily?.refunded_count ?? 0} ta chek`,
      icon: ShoppingCart,
      glow: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400"
    },
    {
      title: "O'rtacha chek miqdori (AOV)",
      value: `${Math.round(daily?.average_order_value ?? 0).toLocaleString()} ${daily?.currency || 'UZS'}`,
      badge: "+6.8%",
      badgeUp: true,
      sub: "Bitta xaridorga to'g'ri keluvchi kassa",
      icon: TrendingUp,
      glow: "border-sky-500/30 bg-sky-500/5 text-sky-400"
    },
    {
      title: "Yalpi marja (Gross Margin)",
      value: `${(daily?.gross_margin ?? 0).toFixed(1)}%`,
      badge: `Foyda: ${(daily?.gross_profit ?? 0).toLocaleString()} UZS`,
      badgeUp: true,
      sub: "Operatsion rentabellik darajasi",
      icon: Percent,
      glow: "border-purple-500/30 bg-purple-500/5 text-purple-400"
    }
  ];

  return (
    <div className="space-y-7">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/60 border border-white/[0.08] p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Jonli Bito Reestri
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Xush kelibsiz, <span className="text-gradient-indigo">KHB Smart Retail</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              Bugungi savdo faoliyati, xarajatlar va inventar monitoringi. Sun'iy intellekt orqali biznesingizni avtomatlashtiring.
            </p>
          </div>

          {/* Action pills */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              AI Maslahat olish
            </button>
            <button
              onClick={() => navigate('/sales')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-white/[0.08] transition cursor-pointer"
            >
              Savdo reestri
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/70 border border-white/[0.06] shadow-xl relative overflow-hidden glass-panel glass-panel-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
              <div className={`p-2.5 rounded-xl border ${kpi.glow}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight font-mono mb-2">
              {kpi.value}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.04]">
              <span className="text-slate-400 text-[11px] truncate">{kpi.sub}</span>
              <span className="font-semibold text-emerald-400 text-[11px]">{kpi.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Charts & Timeframe Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart with Period Selector */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Savdo traektoriyasi dinamikasi</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/[0.06]">
              {(['today', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeRange === range
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range === 'today' ? '1 kun' : range === '7d' ? '7 kun' : '30 kun'}
                </button>
              ))}
            </div>
          </div>

          {analysis?.timeline && analysis.timeline.length > 0 ? (
            <ChartArtifact
              type="line_chart"
              data={{
                x_key: 'date',
                series: [{ key: 'revenue', label: `Tushum (${analysis.currency || 'UZS'})`, color: '#6366f1' }],
                rows: analysis.timeline
              }}
            />
          ) : (
            <div className="h-72 flex items-center justify-center bg-slate-900/60 rounded-2xl border border-white/[0.06] text-xs text-slate-500">
              Grafik uchun yetarli ma'lumot mavjud emas
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Kategoriyalar taqsimoti</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Davr tushumi</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/[0.06] space-y-4 shadow-xl min-h-[340px] flex flex-col justify-center glass-panel">
            {analysis?.top_categories && analysis.top_categories.length > 0 ? (
              analysis.top_categories.map((cat, i) => {
                const maxRev = Math.max(...analysis.top_categories.map(c => c.revenue));
                const pct = maxRev > 0 ? Math.round((cat.revenue / maxRev) * 100) : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{cat.category}</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {cat.revenue.toLocaleString()} {analysis.currency || 'UZS'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Ulush nisbati</span>
                      <span>{cat.units} dona tovar</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-slate-500 py-12">Kategoriyalar ma'lumoti yo'q</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">So'nggi kassa operatsiyalari</h3>
            </div>
            <Link to="/sales" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              Barcha cheklar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/70 overflow-hidden shadow-xl glass-panel">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                <tr>
                  <th className="px-4 py-3">Chek #</th>
                  <th className="px-4 py-3">Xaridor</th>
                  <th className="px-4 py-3">To'lov</th>
                  <th className="px-4 py-3">Holat</th>
                  <th className="px-4 py-3 text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Operatsiyalar mavjud emas
                    </td>
                  </tr>
                ) : (
                  recentSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-400">
                        {s.sale_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {s.customer_name || 'Anonim xaridor'}
                      </td>
                      <td className="px-4 py-3 font-mono uppercase text-[11px] text-slate-400">
                        {s.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Yakunlangan
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {s.net_amount.toLocaleString()} UZS
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock & Inventory Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Ombor zaxirasi ogohlantirishlari</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {lowStockItems.length} ta xavf
            </span>
          </div>

          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-200">{item.product_name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      {item.current_stock} dona
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.current_stock / item.min_stock_threshold) * 50)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Minimal chegara: {item.min_stock_threshold} dona</span>
                    <button
                      onClick={() => navigate('/chat')}
                      className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                    >
                      AI orqali buyurtma &rarr;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-white/[0.06] text-xs text-slate-400">
                Barcha mahsulotlar qoldig'i me'yorida.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
