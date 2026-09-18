import {
  PaginatedResponse,
  Product,
  SaleOrder,
  Expense,
  InventoryItem,
  Customer,
  DailyReport,
  SalesAnalysis,
  ConversationSummary,
  ChatResponse,
  UploadedFile,
  DocumentAnalysis,
  Artifact,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.error || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; version: string; database: string; claude: any }>('/health'),

  // Bito replica
  getProducts: (params?: { page?: number; page_size?: number; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Product>>(`/api/v1/products${q ? `?${q}` : ''}`);
  },
  getProduct: (id: string) => request<Product>(`/api/v1/products/${id}`),

  getSales: (params?: { page?: number; page_size?: number; search?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<SaleOrder>>(`/api/v1/sales${q ? `?${q}` : ''}`);
  },
  getSale: (id: string) => request<SaleOrder>(`/api/v1/sales/${id}`),
  createSale: (data: any) => request<SaleOrder>('/api/v1/sales', { method: 'POST', body: JSON.stringify(data) }),

  getExpenses: (params?: { page?: number; page_size?: number; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Expense>>(`/api/v1/expenses${q ? `?${q}` : ''}`);
  },

  getInventory: (params?: { page?: number; page_size?: number; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<InventoryItem>>(`/api/v1/inventory${q ? `?${q}` : ''}`);
  },

  getCustomers: (params?: { page?: number; page_size?: number; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Customer>>(`/api/v1/customers${q ? `?${q}` : ''}`);
  },

  // Reports & Analysis
  getDailySales: (params?: { date?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<DailyReport>(`/api/v1/reports/daily-sales${q ? `?${q}` : ''}`);
  },
  runSalesAnalysis: (from: string, to: string) =>
    request<SalesAnalysis>('/api/v1/analysis/sales', {
      method: 'POST',
      body: JSON.stringify({ from, to }),
    }),
  getSalesAnalysis: (id: string) => request<SalesAnalysis>(`/api/v1/analysis/sales/${id}`),

  // Conversations & Chat
  getConversations: () => request<ConversationSummary[]>('/api/v1/conversations'),
  getConversation: (id: string) => request<any>(`/api/v1/conversations/${id}`),
  createConversation: (title?: string) =>
    request<ConversationSummary>('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'New Conversation' }),
    }),
  deleteConversation: (id: string) => request<any>(`/api/v1/conversations/${id}`, { method: 'DELETE' }),
  sendMessage: (conversationId: string, content: string, attachment_ids: string[] = [], context: any = {}) =>
    request<ChatResponse>(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachment_ids, context }),
    }),

  // Files
  getFiles: () => request<UploadedFile[]>('/api/v1/files'),
  getFile: (id: string) => request<UploadedFile>(`/api/v1/files/${id}`),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<UploadedFile>('/api/v1/files', { method: 'POST', body: formData });
  },
  analyzeFile: (fileId: string, mode: string = 'general') =>
    request<DocumentAnalysis>(`/api/v1/files/${fileId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  getDownloadUrl: (fileId: string) => `${API_BASE}/api/v1/files/${fileId}/download`,

  // Artifacts
  getArtifact: (id: string) => request<Artifact>(`/api/v1/artifacts/${id}`),
};

