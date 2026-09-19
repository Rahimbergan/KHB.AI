export interface FileRecord {
  id: string;
  original_name?: string;
  filename: string;
  file_size?: number;
  size_bytes?: number;
  size_formatted?: string;
  file_type?: string;
  mime_type?: string;
  status?: 'uploaded' | 'processing' | 'ready' | 'error';
  content_preview?: string;
  analysis_data?: any;
  created_at?: string;
}

export interface PaginatedFilesResponse {
  data: FileRecord[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages?: number;
  };
}
