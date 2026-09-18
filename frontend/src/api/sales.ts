import { request } from './client';
import {
  Sale,
  PaginatedResponse,
  SalesAnalysisResult,
  Product,
  InventoryItem,
  Expense,
  Customer
} from '../types/bito';

export async function getSales(params?: {
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<PaginatedResponse<Sale>> {
  const q = new URLSearchParams();
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.page_size) q.append('page_size', params.page_size.toString());
  if (params?.search) q.append('search', params.search);

  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<PaginatedResponse<Sale>>(`/api/v1/sales${queryStr}`);
}

export async function getSaleById(saleId: string): Promise<Sale> {
  return await request<Sale>(`/api/v1/sales/${saleId}`);
}

export async function createSale(saleData: Partial<Sale>): Promise<Sale> {
  return await request<Sale>('/api/v1/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  });
}

export async function runSalesAnalysis(payload: { from: string; to: string }): Promise<SalesAnalysisResult> {
  return await request<SalesAnalysisResult>('/api/v1/analysis/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getProducts(params?: { search?: string; page?: number }): Promise<PaginatedResponse<Product>> {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', params.page.toString());
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<PaginatedResponse<Product>>(`/api/v1/products${queryStr}`);
}

export async function getInventory(): Promise<PaginatedResponse<InventoryItem>> {
  return await request<PaginatedResponse<InventoryItem>>('/api/v1/inventory');
}

export async function getExpenses(): Promise<PaginatedResponse<Expense>> {
  return await request<PaginatedResponse<Expense>>('/api/v1/expenses');
}

export async function getCustomers(): Promise<PaginatedResponse<Customer>> {
  return await request<PaginatedResponse<Customer>>('/api/v1/customers');
}
