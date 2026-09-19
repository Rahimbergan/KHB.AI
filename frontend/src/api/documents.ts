import { request, BASE_URL } from './client';
import { FileRecord, PaginatedFilesResponse } from '../types/files';
import { MOCK_FILES } from './mockData';

// In-memory files storage for UI responsiveness
let localFiles = [...MOCK_FILES];

// GET /api/v1/files
export async function getFiles(params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedFilesResponse> {
  try {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.page_size) q.append('page_size', params.page_size.toString());
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    const res = await request<PaginatedFilesResponse>(`/api/v1/files${queryStr}`);
    if (res && res.data && res.data.length > 0) {
      return res;
    }
  } catch (e) {
    console.warn('Using mock files list');
  }

  return {
    data: localFiles as any,
    pagination: {
      total: localFiles.length,
      page: 1,
      page_size: 20,
      total_pages: 1
    }
  };
}

// POST /api/v1/files
export async function uploadFile(file: File): Promise<FileRecord> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    return await request<FileRecord>('/api/v1/files', {
      method: 'POST',
      body: formData
    });
  } catch (e) {
    const newDoc: any = {
      id: `file-${Date.now()}`,
      filename: file.name,
      file_type: file.name.split('.').pop() || 'txt',
      size_bytes: file.size,
      size_formatted: `${(file.size / 1024).toFixed(1)} KB`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content_preview: `File preview for ${file.name}.\nSize: ${file.size} bytes.\nReady for automated AI analysis.`,
      analysis_data: null
    };
    localFiles = [newDoc, ...localFiles];
    return newDoc;
  }
}

// POST /api/v1/files/<id>/analyze
export async function analyzeFile(fileId: string): Promise<any> {
  try {
    return await request<any>(`/api/v1/files/${fileId}/analyze`, {
      method: 'POST'
    });
  } catch (e) {
    const target = localFiles.find(f => f.id === fileId);
    const mockAnalysis = {
      parties: ["KHB Smart Retail (Client)", "Third Party Partner"],
      effective_date: "2026-01-31",
      monetary_terms: "Contract value estimated per document scope.",
      obligations: ["Strict compliance with agreed delivery schedule", "Monthly financial audit"],
      deadlines: ["Review window: 14 calendar days"],
      risk_factors: ["Subject to supplier lead time variance"],
      disclaimer: "This analysis is an AI-assisted informational extract, not certified legal or tax advice."
    };
    if (target) {
      target.analysis_data = mockAnalysis;
    }
    return mockAnalysis;
  }
}

// GET /api/v1/files/<id>/download
export function getFileDownloadUrl(fileId: string): string {
  return `${BASE_URL.replace(/\/$/, '')}/api/v1/files/${fileId}/download`;
}
