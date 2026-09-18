export type ArtifactType =
  | 'metric'
  | 'table'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'markdown'
  | 'report'
  | 'document_extract';

export interface MetricArtifactData {
  value: number;
  formatted_value: string;
  change_percent?: number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export interface TableArtifactData {
  columns: string[];
  rows: Array<Record<string, any> | Array<any>>;
}

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ChartArtifactData {
  x_key: string;
  series: ChartSeries[];
  rows: Array<Record<string, any>>;
}

export interface PieChartArtifactData {
  name_key: string;
  value_key: string;
  rows: Array<Record<string, any>>;
}

export interface DocumentExtractArtifactData {
  filename: string;
  summary: string;
  parties: string[];
  dates: string[];
  amounts: string[];
  obligations: string[];
  risks: string[];
  disclaimer: string;
}

export interface Artifact {
  id: string;
  conversation_id?: string;
  message_id?: string;
  type: ArtifactType;
  title: string;
  description?: string;
  data: any;
  config?: Record<string, any>;
  source_ids?: string[];
  created_at?: string;
}
