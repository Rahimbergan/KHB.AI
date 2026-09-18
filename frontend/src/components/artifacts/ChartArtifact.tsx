import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { ChartArtifactData } from '../../types/artifacts';
import { BarChart2, TrendingUp } from 'lucide-react';

interface Props {
  type: 'line_chart' | 'bar_chart';
  data: ChartArtifactData;
}

export const ChartArtifact: React.FC<Props> = ({ type: initialType, data }) => {
  const [chartType, setChartType] = useState(initialType);
  const rows = data.rows || [];
  const series = data.series || [{ key: 'revenue', label: 'Tushum', color: '#6366f1' }];
  const xKey = data.x_key || 'date';

  const formatNumber = (val: any) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
      return val.toString();
    }
    return val;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="text-[11px] font-medium text-slate-400 mb-1 font-mono">{label}</div>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-slate-300">{p.name}:</span>
              <span className="font-mono text-indigo-300">
                {typeof p.value === 'number' ? `${p.value.toLocaleString()} UZS` : p.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 bg-slate-900/80 rounded-2xl border border-white/[0.06] shadow-xl space-y-3">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div className="text-xs text-slate-400 font-medium">
          Dinamika tahlili ({rows.length} nuqta)
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => setChartType('line_chart')}
            className={`p-1.5 rounded-md text-xs transition ${
              chartType === 'line_chart'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Silliq grafik"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType('bar_chart')}
            className={`p-1.5 rounded-md text-xs transition ${
              chartType === 'bar_chart'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Ustunli grafik"
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line_chart' ? (
            <AreaChart data={rows} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {series.map((s, idx) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label || s.key}
                  stroke={s.color || '#6366f1'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={idx === 0 ? 'url(#colorRevenue)' : 'url(#colorProfit)'}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={rows} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {series.map(s => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label || s.key}
                  fill={s.color || '#6366f1'}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
