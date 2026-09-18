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

// GET /api/v1/products
export async function getProducts(params?: {
  search?: string;
  page?: number;
  page_size?: number;
  from?: string;
  to?: string;
}): Promise<PaginatedResponse<Product>> {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.page_size) q.append('page_size', params.page_size.toString());
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<PaginatedResponse<Product>>(`/api/v1/products${queryStr}`);
}

// GET /api/v1/products/<id>
export async function getProductById(productId: string): Promise<Product> {
  return await request<Product>(`/api/v1/products/${productId}`);
}

// GET /api/v1/sales
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

// GET /api/v1/sales/<id>
export async function getSaleById(saleId: string): Promise<Sale> {
  return await request<Sale>(`/api/v1/sales/${saleId}`);
}

// POST /api/v1/sales
export async function createSale(saleData: Partial<Sale>): Promise<Sale> {
  return await request<Sale>('/api/v1/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  });
}

// GET /api/v1/expenses
export async function getExpenses(params?: {
  category?: string;
  page?: number;
  page_size?: number;
  from?: string;
  to?: string;
}): Promise<PaginatedResponse<Expense>> {
  const q = new URLSearchParams();
  if (params?.category) q.append('category', params.category);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.page_size) q.append('page_size', params.page_size.toString());
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<PaginatedResponse<Expense>>(`/api/v1/expenses${queryStr}`);
}

// GET /api/v1/inventory
export async function getInventory(params?: {
  low_stock_only?: boolean;
}): Promise<PaginatedResponse<InventoryItem>> {
  const q = new URLSearchParams();
  if (params?.low_stock_only) q.append('low_stock_only', 'true');
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<PaginatedResponse<InventoryItem>>(`/api/v1/inventory${queryStr}`);
}

// GET /api/v1/customers
export async function getCustomers(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Customer>> {
  const q = new URLSearchParams();
  if (params?.search) q.append('search', params.search);
  if (params?.page) q.append('page', params.page.toString());
  if (params?.page_size) q.append('page_size', params.page_size.toString());
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<PaginatedResponse<Customer>>(`/api/v1/customers${queryStr}`);
}

// POST /api/v1/analysis/sales
export async function runSalesAnalysis(payload: { from: string; to: string }): Promise<SalesAnalysisResult> {
  return await request<SalesAnalysisResult>('/api/v1/analysis/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// GET /api/v1/analysis/sales/<id>
export async function getSalesAnalysisById(analysisId: string): Promise<SalesAnalysisResult> {
  return await request<SalesAnalysisResult>(`/api/v1/analysis/sales/${analysisId}`);
}
