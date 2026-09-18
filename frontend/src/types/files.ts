export interface FileRecord {
  id: string;
  original_name: string;
  filename: string;
  file_size: number;
  mime_type?: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  analysis_data?: any;
  created_at: string;
}
