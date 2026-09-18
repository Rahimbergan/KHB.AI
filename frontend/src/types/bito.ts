export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category_id?: string;
  category_name?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  unit: string;
  is_active: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost_price: number;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  customer_name?: string;
  sale_date: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'refunded' | 'cancelled';
  notes?: string;
  created_at?: string;
  items?: SaleItem[];
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  payment_method: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  category_name?: string;
  current_stock: number;
  min_stock_threshold: number;
  location: string;
  is_low_stock: boolean;
  last_updated?: string;
}

export interface DailySalesReport {
  date: string;
  currency: string;
  orders_count: number;
  refunded_count: number;
  cancelled_count: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin: number;
  average_order_value: number;
  total_units_sold: number;
  refund_amount: number;
  hourly_sales: Array<{ hour: string; revenue: number }>;
  top_products: Array<{ name: string; units: number; revenue: number }>;
  disclaimer: string;
}

export interface SalesAnalysisMetrics {
  total_revenue: number;
  revenue_change_percent: number;
  trend: 'up' | 'down';
  orders_count: number;
  units_sold: number;
  average_order_value: number;
  gross_profit: number;
  gross_margin: number;
  refunded_count: number;
  cancelled_count: number;
}

export interface SalesAnalysisResult {
  period: { from: string; to: string; days: number };
  previous_period: { from: string; to: string; revenue: number };
  metrics: SalesAnalysisMetrics;
  top_products: Array<{ name: string; units: number; revenue: number }>;
  top_categories: Array<{ category: string; revenue: number; units: number }>;
  timeline: Array<{ date: string; revenue: number }>;
  anomalies: Array<{ date: string; type: 'spike' | 'drop'; description: string }>;
  currency: string;
  disclaimer: string;
}
