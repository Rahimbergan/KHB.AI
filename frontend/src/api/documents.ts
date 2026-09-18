import { request, BASE_URL } from './client';
import { FileRecord } from '../types/files';

export async function getFiles(): Promise<{ data: FileRecord[] }> {
  return await request<{ data: FileRecord[] }>('/api/v1/files');
}

export async function getFileById(fileId: string): Promise<FileRecord> {
  return await request<FileRecord>(`/api/v1/files/${fileId}`);
}

export async function uploadFile(file: File): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);

  return await request<FileRecord>('/api/v1/files', {
    method: 'POST',
    body: formData,
  });
}

export async function analyzeFile(fileId: string): Promise<any> {
  return await request<any>(`/api/v1/files/${fileId}/analyze`, {
    method: 'POST'
  });
}

export function getFileDownloadUrl(fileId: string): string {
  return `${BASE_URL.replace(/\/$/, '')}/api/v1/files/${fileId}/download`;
}
