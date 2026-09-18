import { request } from './client';
import { DailySalesReport } from '../types/bito';

export interface HealthCheckResponse {
  status: string;
  version?: string;
  database?: string;
  used_claude?: boolean;
  model?: string;
}

export async function getHealth(): Promise<HealthCheckResponse> {
  return await request<HealthCheckResponse>('/health');
}

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  try {
    return await getHealth();
  } catch (err) {
    return { status: 'offline' };
  }
}

export async function getDailySales(params?: string | { date?: string; from?: string; to?: string }): Promise<DailySalesReport> {
  const q = new URLSearchParams();
  if (typeof params === 'string') {
    if (params) q.append('date', params);
  } else if (params) {
    if (params.date) q.append('date', params.date);
    if (params.from) q.append('from', params.from);
    if (params.to) q.append('to', params.to);
  }
  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await request<DailySalesReport>(`/api/v1/reports/daily-sales${queryStr}`);
}
