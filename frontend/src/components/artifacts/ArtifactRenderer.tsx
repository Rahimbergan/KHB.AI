import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  Table as TableIcon,
  FileText,
  Maximize2,
  Minimize2,
  Copy,
  Check
} from 'lucide-react';
import { Artifact } from '../../types/artifacts';
import { MetricArtifact } from './MetricArtifact';
import { TableArtifact } from './TableArtifact';
import { ChartArtifact } from './ChartArtifact';
import { DocumentExtractArtifact } from './DocumentExtractArtifact';

interface Props {
  artifact: Artifact;
}

export const ArtifactRenderer: React.FC<Props> = ({ artifact }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getIcon = () => {
    switch (artifact.type) {
      case 'metric':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'table':
        return <TableIcon className="w-4 h-4 text-sky-400" />;
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
        return <BarChart2 className="w-4 h-4 text-indigo-400" />;
      case 'document_extract':
      case 'markdown':
      case 'report':
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(artifact.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (artifact.type) {
      case 'metric':
        return <MetricArtifact data={artifact.data} />;
      case 'table':
        return <TableArtifact data={artifact.data} />;
      case 'line_chart':
      case 'bar_chart':
        return <ChartArtifact type={artifact.type} data={artifact.data} />;
      case 'document_extract':
        return <DocumentExtractArtifact data={artifact.data} />;
      case 'markdown':
      case 'report':
        return (
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {typeof artifact.data === 'string' ? artifact.data : JSON.stringify(artifact.data, null, 2)}
          </div>
        );
      default:
        return (
          <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-slate-400 overflow-x-auto">
            {JSON.stringify(artifact.data, null, 2)}
          </div>
        );
    }
  };

  return (
    <div
      className={`my-3 rounded-xl border border-slate-800/90 bg-slate-900/60 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-200 ${
        isExpanded ? 'fixed inset-4 z-50 overflow-y-auto bg-slate-950/95 p-6 border-slate-700' : 'w-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          {getIcon()}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wide">{artifact.title}</h4>
            {artifact.description && (
              <p className="text-[11px] text-slate-400">{artifact.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {artifact.type.replace('_', ' ')}
          </span>
          <button
            onClick={copyJSON}
            title="JSON nusxalash"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Kichraytirish' : 'Kattalashtirish'}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">{renderContent()}</div>
    </div>
  );
};
