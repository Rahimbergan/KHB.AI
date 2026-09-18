import React from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  ShieldCheck,
  Info,
  CheckCircle2
} from 'lucide-react';
import { DocumentExtractArtifactData } from '../../types/artifacts';

interface Props {
  data: DocumentExtractArtifactData;
}

export const DocumentExtractArtifact: React.FC<Props> = ({ data }) => {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-6 space-y-5 shadow-2xl backdrop-blur-xl glass-panel">
      {/* Executive Summary Header */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight">{data.filename || 'Hujjat tahlili'}</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              AI Extract
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{data.summary}</p>
        </div>
      </div>

      {/* 3-Column Entity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Parties */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-indigo-400" />
            Tomonlar
          </div>
          <ul className="space-y-1.5 pt-1">
            {data.parties && data.parties.length > 0 ? (
              data.parties.map((p, i) => (
                <li key={i} className="text-xs text-slate-200 font-medium flex items-start gap-1.5">
                  <span className="text-indigo-400">•</span>
                  <span className="line-clamp-2">{p}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">Aniqlanmadi</li>
            )}
          </ul>
        </div>

        {/* Dates */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Muhim muddatlar
          </div>
          <ul className="space-y-1.5 pt-1">
            {data.dates && data.dates.length > 0 ? (
              data.dates.map((d, i) => (
                <li key={i} className="text-xs text-emerald-300 font-mono font-medium flex items-center gap-1.5">
                  <span className="text-emerald-400">•</span>
                  <span>{d}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">Mavjud emas</li>
            )}
          </ul>
        </div>

        {/* Amounts */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Moliyaviy summalar
          </div>
          <ul className="space-y-1.5 pt-1">
            {data.amounts && data.amounts.length > 0 ? (
              data.amounts.map((a, i) => (
                <li key={i} className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1.5">
                  <span className="text-amber-400">•</span>
                  <span>{a}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">Ko'rsatilmagan</li>
            )}
          </ul>
        </div>
      </div>

      {/* Obligations */}
      {data.obligations && data.obligations.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Asosiy majburiyatlar va bandlar:
          </div>
          <div className="space-y-1.5 pt-1">
            {data.obligations.map((ob, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{ob}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Identified Risks */}
      {data.risks && data.risks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            Aniqlangan huquqiy va operatsion xavflar:
          </div>
          <div className="space-y-1.5 pt-1">
            {data.risks.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-rose-200">
                <span className="text-rose-400 font-bold shrink-0">⚠</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Legal Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/80 italic flex items-center gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="leading-snug">
          {data.disclaimer || 'This is an informational document analysis, not legal advice. A qualified lawyer should review important decisions.'}
        </span>
      </div>
    </div>
  );
};
