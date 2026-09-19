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
import { MOCK_SALES_ORDERS, MOCK_DAILY_SALES } from './mockData';

// GET /api/v1/products
export async function getProducts(params?: {
  search?: string;
  page?: number;
  page_size?: number;
  from?: string;
  to?: string;
}): Promise<PaginatedResponse<Product>> {
  try {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.page_size) q.append('page_size', params.page_size.toString());
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return await request<PaginatedResponse<Product>>(`/api/v1/products${queryStr}`);
  } catch (e) {
    return {
      data: MOCK_DAILY_SALES.top_products.map((p, idx) => ({
        id: `p-${idx}`,
        name: p.name,
        category: p.category,
        sku: `SKU-${idx + 100}`,
        price: p.revenue / p.units_sold,
        cost: (p.revenue / p.units_sold) * 0.8,
        currency: "UZS",
        is_active: true
      })),
      pagination: { total: MOCK_DAILY_SALES.top_products.length, page: 1, page_size: 20, total_pages: 1 }
    };
  }
}

// GET /api/v1/sales
export async function getSales(params?: {
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<PaginatedResponse<Sale>> {
  try {
    const q = new URLSearchParams();
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.page_size) q.append('page_size', params.page_size.toString());
    if (params?.search) q.append('search', params.search);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    const res = await request<PaginatedResponse<Sale>>(`/api/v1/sales${queryStr}`);
    if (res && res.data && res.data.length > 0) {
      return res;
    }
  } catch (e) {
    console.warn('Using mock sales orders data');
  }

  let filtered = [...MOCK_SALES_ORDERS];
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.sale_number.toLowerCase().includes(s) ||
      (item.customer_name && item.customer_name.toLowerCase().includes(s))
    );
  }

  return {
    data: filtered as any,
    pagination: {
      total: filtered.length,
      page: params?.page || 1,
      page_size: params?.page_size || 15,
      total_pages: 1
    }
  };
}

// GET /api/v1/sales/<id>
export async function getSaleById(saleId: string): Promise<Sale> {
  try {
    return await request<Sale>(`/api/v1/sales/${saleId}`);
  } catch (e) {
    const match = MOCK_SALES_ORDERS.find(s => s.id === saleId || s.sale_number === saleId);
    return (match || MOCK_SALES_ORDERS[0]) as any;
  }
}

// POST /api/v1/analysis/sales
export async function runSalesAnalysis(body: {
  from: string;
  to: string;
}): Promise<SalesAnalysisResult> {
  try {
    const res = await request<any>('/api/v1/analysis/sales', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (res && (res.metrics || res.data?.metrics)) {
      return res.data || res;
    }
  } catch (e) {
    console.warn('Using mock sales analysis result');
  }

  return {
    id: 'analysis-seeded',
    period: { from: body.from, to: body.to },
    currency: 'UZS',
    metrics: {
      total_revenue: 58700000,
      total_cost: 48280000,
      gross_profit: 10420000,
      gross_margin: 17.75,
      orders_count: 5,
      units_sold: 11,
      average_order_value: 11740000,
      revenue_change_percent: 46.38,
      profit_change_percent: 32.1,
      trend: 'up'
    },
    previous_period: {
      from: '2025-12-01',
      to: '2025-12-31',
      revenue: 40100000,
      profit: 7890000,
      orders_count: 4
    },
    top_products: MOCK_DAILY_SALES.top_products,
    top_categories: [
      { category: 'Smart Home & Gadgets', revenue: 29400000, units: 6 },
      { category: 'Laptops & Computers', revenue: 15000000, units: 2 },
      { category: 'Smartphones & Tablets', revenue: 11900000, units: 1 },
      { category: 'Audio & Wearables', revenue: 2400000, units: 2 },
    ],
    timeline: MOCK_DAILY_SALES.timeline,
    anomalies: [
      {
        date: '2026-01-31',
        type: 'revenue_spike',
        message: 'High sales volume driven by Smart Home category peak (+46.38% vs prior period).'
      }
    ]
  };
}

// GET /api/v1/inventory
export async function getInventory(params?: {
  low_stock_only?: boolean;
}): Promise<PaginatedResponse<InventoryItem>> {
  try {
    const q = new URLSearchParams();
    if (params?.low_stock_only) q.append('low_stock_only', 'true');
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return await request<PaginatedResponse<InventoryItem>>(`/api/v1/inventory${queryStr}`);
  } catch (e) {
    return {
      data: [
        { id: 'inv-1', product_id: 'p-1', product_name: 'Samsung Galaxy S24 256GB Gray', current_stock: 5, min_stock_threshold: 10, is_low_stock: true, last_restocked: '2026-01-15' },
        { id: 'inv-2', product_id: 'p-2', product_name: 'Apple Watch Series 9 45mm', current_stock: 4, min_stock_threshold: 8, is_low_stock: true, last_restocked: '2026-01-20' },
        { id: 'inv-3', product_id: 'p-3', product_name: 'Xiaomi Robot Vacuum S10+', current_stock: 8, min_stock_threshold: 5, is_low_stock: false, last_restocked: '2026-01-25' },
      ],
      pagination: { total: 3, page: 1, page_size: 20, total_pages: 1 }
    };
  }
}
