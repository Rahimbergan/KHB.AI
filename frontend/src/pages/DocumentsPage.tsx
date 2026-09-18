import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Download,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { getFiles, uploadFile, analyzeFile, getFileDownloadUrl } from '../api/documents';
import { FileRecord } from '../types/files';
import { DocumentExtractArtifact } from '../components/artifacts/DocumentExtractArtifact';

export const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    data: filesData,
    isLoading: filesLoading,
    isError: filesError,
    error: filesErrObj,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: getFiles,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (newFile) => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedFile(newFile);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Faylni yuklashda xatolik yuz berdi');
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: (fileId: string) => analyzeFile(fileId),
    onSuccess: (data) => {
      if (selectedFile) {
        setSelectedFile({
          ...selectedFile,
          analysis_data: data
        });
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadMutation.mutate(e.dataTransfer.files[0]);
    }
  };

  const files = filesData?.data || [];

  const getFileIcon = (mime?: string, name?: string) => {
    if (name?.endsWith('.xlsx') || name?.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (name?.endsWith('.json') || name?.endsWith('.txt')) {
      return <FileCode className="w-5 h-5 text-sky-400" />;
    }
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Hujjatlar markazi</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AI Document Agent
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Shartnomalar, hisob-fakturalar va kvitansiyalarni sun'iy intellekt orqali chuqur tahlil qilish
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          Fayl yuklash
        </button>
      </div>

      {uploadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-400 font-bold px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl scale-[1.01]'
            : 'border-white/[0.08] bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.xlsx,.docx,.json"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
          {uploadMutation.isPending ? (
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>
        <div className="text-sm font-bold text-white">
          Faylni tahlil qilish uchun shu yerga tashlang yoki bosing
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          PDF shartnomalar, Excel fakturalar, CSV jadvallar va Word hujjatlari (Maksimal 16MB)
        </p>
      </div>

      {/* Main Grid: Files List vs Document Detail & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Files List */}
        <div className="rounded-3xl border border-white/[0.06] bg-slate-900/70 p-5 space-y-3.5 shadow-xl glass-panel">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              Yuklangan hujjatlar ({files.length})
            </h3>
            <button
              onClick={() => refetch()}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Yangilash"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {filesLoading ? (
            <div className="text-center py-12 text-xs text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <span>Hujjatlar yuklanmoqda...</span>
            </div>
          ) : filesError ? (
            <div className="text-xs text-rose-400 py-6 text-center space-y-2">
              <AlertCircle className="w-5 h-5 mx-auto" />
              <div>Fayllarni yuklab bo'lmadi</div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 space-y-1">
              <FileText className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
              <p>Hali hujjat yuklanmagan.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {files.map(f => {
                const isSelected = selectedFile?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFile(f)}
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-950/60 border-white/[0.04] hover:bg-slate-800/40 hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded-xl bg-slate-900 border border-white/[0.06] shrink-0">
                        {getFileIcon(f.mime_type, f.original_name)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 truncate">{f.original_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {(f.file_size / 1024).toFixed(0)} KB • {new Date(f.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase">
                      {f.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Document Preview & AI Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFile ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-slate-900/80 rounded-3xl border border-white/[0.06] shadow-xl glass-panel">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/[0.06] text-indigo-400">
                    {getFileIcon(selectedFile.mime_type, selectedFile.original_name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{selectedFile.original_name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Hajmi: {(selectedFile.file_size / 1024).toFixed(1)} KB • ID: {selectedFile.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getFileDownloadUrl(selectedFile.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-white/[0.08] transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Yuklab olish
                  </a>
                  <button
                    onClick={() => analyzeMutation.mutate(selectedFile.id)}
                    disabled={analyzeMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
                  >
                    {analyzeMutation.isPending ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Qayta tahlil qilish
                  </button>
                </div>
              </div>

              {/* Analysis Result / Extracted Data */}
              {selectedFile.analysis_data ? (
                <DocumentExtractArtifact data={selectedFile.analysis_data} />
              ) : (
                <div className="p-12 text-center rounded-3xl border border-white/[0.06] bg-slate-900/50 text-xs text-slate-400 space-y-3">
                  <FileCheck className="w-10 h-10 text-indigo-400 mx-auto stroke-1" />
                  <div className="font-semibold text-white">Tahlil natijalari mavjud emas</div>
                  <p className="max-w-sm mx-auto text-slate-500">
                    Ushbu hujjat bo'yicha tahlilni boshlash uchun yuqoridagi "Qayta tahlil qilish" tugmasini bosing.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/[0.06] bg-slate-900/40 text-slate-500 space-y-3 glass-panel">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/40 flex items-center justify-center">
                <FileText className="w-7 h-7 text-slate-500 stroke-1" />
              </div>
              <div className="text-sm font-semibold text-slate-300">Hujjat tanlanmagan</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Tafsilotlar, muddatlar va huquqiy tahlilni ko'rish uchun chap tarafdagi ro'yxatdan biror faylni tanlang.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
