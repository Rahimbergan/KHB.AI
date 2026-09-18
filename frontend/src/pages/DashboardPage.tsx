import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';

interface DashboardPageProps {
  currentDate: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentDate }) => {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['dailyReport', currentDate],
    queryFn: () => api.getDailySales({ date: currentDate }),
  });

  const { data: monthAnalysis } = useQuery({
    queryKey: ['monthAnalysis', currentDate],
    queryFn: () => {
      const from = currentDate.substring(0, 7) + '-01';
      return api.runSalesAnalysis(from, currentDate);
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' UZS';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mr-3"></div>
        Loading dashboard metrics for {currentDate}...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm">
        Failed to load daily report: {(error as any)?.message || 'Unknown error'}
      </div>
    );
  }

  const kpis = [
    {
      title: "Today's Revenue",
      value: formatCurrency(report.total_revenue),
      sub: `${report.order_count} orders completed`,
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Gross Profit',
      value: formatCurrency(report.gross_profit),
      sub: `Margin: ${report.gross_margin_percent}%`,
      icon: TrendingUp,
      color: 'text-teal-400 bg-teal-500/10',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(report.average_order_value),
      sub: `${report.units_sold} units sold`,
      icon: ShoppingCart,
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      title: 'Operating Profit Est.',
      value: formatCurrency(report.net_estimate),
      sub: `Expenses: ${formatCurrency(report.expenses_total)}`,
      icon: Percent,
      color: 'text-amber-400 bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Business Overview — {report.date}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time operations summary from local Bito dataset.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">
            KHB Smart Retail
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <div className={`p-2 rounded-xl ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{kpi.value}</div>
              <div className="text-xs text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Chart & Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Sales Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Daily Sales Trend (Month to Date)</h3>
              <p className="text-xs text-slate-400">Revenue across daily sales batches</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthAnalysis?.sales_by_day || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(d) => d.slice(5)}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products Today */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Top Products Today</h3>
            <span className="text-xs text-emerald-400 font-medium">Ranked by revenue</span>
          </div>
          <div className="space-y-3">
            {report.top_products.slice(0, 5).map((prod, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-slate-200 truncate">{prod.product_name}</div>
                  <div className="text-[11px] text-slate-400">{prod.category} · {prod.units} units</div>
                </div>
                <div className="text-xs font-bold text-white shrink-0">
                  {formatCurrency(prod.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Actions & Disclaimer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>AI Operations Alert</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fastest moving categories today: <span className="text-white font-medium">Smart Home & Audio</span>.
            Check buffer inventory on Anker and Apple accessories to avoid lost baskets before the weekend.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300">Need Deep Business Advice?</div>
            <p className="text-xs text-slate-400 mt-1">
              Ask questions or analyze legal contracts with the AI Operations Assistant.
            </p>
          </div>
          <a
            href="/chat"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all shrink-0 ml-4"
          >
            <span>Open Chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="text-[11px] text-slate-400 italic text-center pt-4 border-t border-slate-900">
        {report.disclaimer}
      </div>
    </div>
  );
};

