export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  is_active: boolean;
}

export interface SaleOrderItem {
  id?: string;
  product_id?: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  total_cost: number;
}

export interface SaleOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_id?: string;
  customer_name: string;
  status: string;
  total_amount: number;
  total_cost: number;
  discount_amount: number;
  payment_method: string;
  notes?: string;
  items: SaleOrderItem[];
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  warehouse: string;
  quantity: number;
  reorder_point: number;
  is_low_stock: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  total_orders: number;
  total_spent: number;
}

export interface DailyReport {
  date: string;
  currency: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_percent: number;
  order_count: number;
  units_sold: number;
  average_order_value: number;
  top_products: Array<{
    product_name: string;
    category: string;
    revenue: number;
    units: number;
    profit: number;
  }>;
  top_categories: Array<{
    category: string;
    revenue: number;
    units: number;
    profit: number;
  }>;
  sales_by_payment_method: Array<{
    method: string;
    amount: number;
  }>;
  expenses_total: number;
  net_estimate: number;
  sales_by_day?: Array<{
    date: string;
    revenue: number;
    orders: number;
    units: number;
    profit: number;
  }>;
  disclaimer: string;
}

export interface SalesAnalysis {
  id?: string;
  from_date: string;
  to_date: string;
  currency: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin: number;
  number_of_orders: number;
  units_sold: number;
  average_order_value: number;
  refunds_count: number;
  refunds_amount: number;
  top_products: any[];
  top_categories: any[];
  sales_by_day: any[];
  sales_by_hour: any[];
  previous_period_comparison: any;
  anomalies: Array<{
    type: string;
    severity: string;
    date?: string;
    description: string;
  }>;
  disclaimer: string;
}

export interface Artifact {
  id: string;
  type: 'metric' | 'table' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'markdown' | 'report' | 'document_extract';
  title: string;
  description?: string;
  data: any;
  config?: any;
  source_ids?: string[];
  created_at?: string;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ChatResponse {
  message: MessageItem;
  artifacts: Artifact[];
  sources: string[];
  usage: {
    used_claude: boolean;
    model?: string;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text_preview?: string;
  extracted_text?: string;
  metadata?: any;
  created_at: string;
}

export interface DocumentAnalysis {
  file_id: string;
  filename: string;
  summary: string;
  parties: string[];
  dates: string[];
  amounts: string[];
  obligations: string[];
  deadlines: string[];
  risks: string[];
  missing_information: string[];
  simple_explanation: string;
  disclaimer: string;
}

