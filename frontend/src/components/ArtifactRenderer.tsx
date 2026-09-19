import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { Artifact } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ArtifactRendererProps {
  artifact: Artifact;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifact }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { type, title, description, data } = artifact;

  if (type === 'metric') {
    const isPositive = data.trend === 'up';
    return (
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{data.formatted_value || data.value}</div>
        {data.change_percent !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium">
            {isPositive ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{data.change_percent}%
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> {data.change_percent}%
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400">vs previous period</span>
          </div>
        )}
        {description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{description}</div>}
      </div>
    );
  }

  if (type === 'bar_chart') {
    const series = data.series || [{ key: 'revenue', color: '#10b981' }];
    return (
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</div>
        {description && <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</div>}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
              <XAxis dataKey={data.x_key || 'product'} stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#475569' : '#cbd5e1',
                  borderRadius: '8px',
                  color: isDark ? '#fff' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              {series.map((s: any) => (
                <Bar key={s.key} dataKey={s.key} fill={s.color || '#10b981'} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'line_chart') {
    const series = data.series || [{ key: 'revenue', color: '#10b981' }];
    return (
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</div>
        {description && <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</div>}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.rows || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
              <XAxis dataKey={data.x_key || 'date'} stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#475569' : '#cbd5e1',
                  borderRadius: '8px',
                  color: isDark ? '#fff' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              {series.map((s: any) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color || '#10b981'}
                  strokeWidth={2}
                  dot={{ fill: s.color || '#10b981', r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    const columns = data.columns || [];
    const rows = data.rows || [];
    return (
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm dark:shadow-lg overflow-x-auto transition-colors">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</div>
        {description && <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</div>}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
              {columns.map((col: string) => (
                <th key={col} className="py-2 px-2.5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {rows.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                {columns.map((col: string) => (
                  <td key={col} className="py-2 px-2.5 text-slate-800 dark:text-slate-200">
                    {row[col] !== undefined ? String(row[col]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'document_extract') {
    return (
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm dark:shadow-lg space-y-3 transition-colors">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <FileText className="w-4 h-4" />
          <span>{title}</span>
        </div>
        {data.summary && <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{data.summary}</p>}

        {data.deadlines && data.deadlines.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5" /> Key Deadlines
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5 list-disc list-inside">
              {data.deadlines.slice(0, 3).map((d: string, i: number) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {data.risks && data.risks.length > 0 && (
          <div className="bg-rose-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Identified Risks
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5 list-disc list-inside">
              {data.risks.slice(0, 3).map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {data.disclaimer && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700/50">
            {data.disclaimer}
          </div>
        )}
      </div>
    );
  }

  // Generic fallback
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-sm dark:shadow-lg transition-colors">
      <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{title}</div>
      <pre className="text-xs text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
