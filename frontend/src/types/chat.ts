import { Artifact } from './artifacts';

export interface ChatSource {
  title: string;
  url?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment_ids?: string[];
  sources?: ChatSource[];
  artifacts?: Artifact[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  message_count?: number;
  messages?: ChatMessage[];
}

export interface SendMessagePayload {
  content: string;
  attachment_ids?: string[];
  context?: {
    date?: string;
    dashboard_filters?: Record<string, any>;
  };
}

export interface SendMessageResponse {
  message: {
    id: string;
    role: 'assistant';
    content: string;
    created_at: string;
  };
  artifacts: Artifact[];
  sources: ChatSource[];
  usage: {
    used_claude: boolean;
    model?: string;
  };
}
