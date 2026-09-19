import { request } from './client';
import { DailySalesReport } from '../types/bito';
import { MOCK_DAILY_SALES } from './mockData';

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
    return { status: 'replica', used_claude: false, model: 'Deterministic local Bito replica' };
  }
}

export async function getDailySales(params?: string | { date?: string; from?: string; to?: string }): Promise<DailySalesReport> {
  try {
    const q = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) q.append('date', params);
    } else if (params) {
      if (params.date) q.append('date', params.date);
      if (params.from) q.append('from', params.from);
      if (params.to) q.append('to', params.to);
    }
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    const res = await request<any>(`/api/v1/reports/daily-sales${queryStr}`);
    if (res && (res.total_revenue !== undefined || res.data?.total_revenue !== undefined)) {
      return res.data || res;
    }
  } catch (err) {
    console.warn('Backend API unavailable, utilizing Bito Local Replica data:', err);
  }
  return MOCK_DAILY_SALES as any;
}
