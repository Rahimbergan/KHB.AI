import { request } from './client';
import { DailySalesReport } from '../types/bito';

export async function getDailySales(date?: string): Promise<DailySalesReport> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return await request<DailySalesReport>(`/api/v1/reports/daily-sales${query}`);
}

export async function checkBackendHealth(): Promise<{ status: string; used_claude?: boolean }> {
  try {
    return await request<{ status: string; used_claude?: boolean }>('/health');
  } catch (err) {
    return { status: 'offline' };
  }
}
