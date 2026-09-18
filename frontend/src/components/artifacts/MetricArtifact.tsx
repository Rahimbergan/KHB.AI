import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { MetricArtifactData } from '../../types/artifacts';

interface Props {
  data: MetricArtifactData;
}

export const MetricArtifact: React.FC<Props> = ({ data }) => {
  const isUp = data.trend === 'up' || (data.change_percent && data.change_percent > 0);
  const isDown = data.trend === 'down' || (data.change_percent && data.change_percent < 0);

  return (
    <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
      <div className="text-3xl font-bold tracking-tight text-white mb-1">
        {data.formatted_value || data.value.toLocaleString()}
      </div>
      <div className="flex items-center gap-2 text-sm">
        {data.change_percent !== undefined && (
          <span
            className={`inline-flex items-center font-medium px-2 py-0.5 rounded-full text-xs ${
              isUp
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isDown
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            {isUp && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {isDown && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {!isUp && !isDown && <Minus className="w-3.5 h-3.5 mr-0.5" />}
            {Math.abs(data.change_percent)}%
          </span>
        )}
        {data.subtitle && <span className="text-slate-400 text-xs">{data.subtitle}</span>}
      </div>
    </div>
  );
};
