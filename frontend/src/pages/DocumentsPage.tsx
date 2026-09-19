import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Download,
  Sparkles,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { UploadedFile, DocumentAnalysis } from '../types';

export const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => api.getFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadFile(file),
    onSuccess: (newFile) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setSelectedFile(newFile);
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (fileId: string) => api.analyzeFile(fileId),
    onSuccess: (data) => {
      setAnalysis(data);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'csv' || type === 'xlsx') return FileSpreadsheet;
    return FileText;
  };

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Header & Upload Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Documents & Contract Intelligence</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload contracts, receipts, or spreadsheets for automated duty, date, and risk extraction.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0">
          {uploadMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>{uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.csv,.xlsx,.docx"
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="text-sm font-bold text-slate-900 dark:text-white px-2">Uploaded Documents</div>
          {isLoading ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center">Loading documents...</div>
          ) : files?.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center">No documents uploaded yet.</div>
          ) : (
            <div className="space-y-2">
              {files?.map((f) => {
                const Icon = getFileIcon(f.file_type);
                const isSelected = selectedFile?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFile(f);
                      setAnalysis(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 truncate">
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{f.filename}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                          {f.file_type} · {(f.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Document Details & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFile ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedFile.filename}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Type: <span className="uppercase font-semibold text-slate-700 dark:text-slate-300">{selectedFile.file_type}</span> · Size: {(selectedFile.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={api.getDownloadUrl(selectedFile.id)}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => analyzeMutation.mutate(selectedFile.id)}
                    disabled={analyzeMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {analyzeMutation.isPending ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Analyze Document</span>
                  </button>
                </div>
              </div>

              {/* Analysis Results Display */}
              {analysis && (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 p-5 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>AI Document Analysis Results</span>
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-1">Executive Summary:</div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Parties & Amounts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1">Identified Parties:</div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                        {analysis.parties.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1">Monetary Terms:</div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                        {analysis.amounts.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Deadlines & Obligations */}
                  <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Deadlines & Obligations:</span>
                    </div>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                      {analysis.deadlines.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-rose-200 dark:border-rose-900/40 space-y-2">
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Identified Liability & Risks:</span>
                    </div>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                      {analysis.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Legal Disclaimer */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    {analysis.disclaimer}
                  </div>
                </div>
              )}

              {/* Text Preview */}
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Content Preview:</div>
                <pre className="text-xs text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedFile.extracted_text_preview || 'No text extracted.'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs shadow-sm">
              Select a document from the list to preview metadata and trigger AI analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
