import { request } from './client';
import { Conversation, SendMessagePayload, SendMessageResponse } from '../types/chat';

export async function getConversations(): Promise<{ data: Conversation[] }> {
  return await request<{ data: Conversation[] }>('/api/v1/conversations');
}

export async function getConversation(id: string): Promise<Conversation> {
  return await request<Conversation>(`/api/v1/conversations/${id}`);
}

export async function createConversation(title?: string): Promise<Conversation> {
  return await request<Conversation>('/api/v1/conversations', {
    method: 'POST',
    body: JSON.stringify({ title: title || 'Yangi muloqot' })
  });
}

export async function sendMessage(conversationId: string, payload: SendMessagePayload): Promise<SendMessageResponse> {
  return await request<SendMessageResponse>(`/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  return await request<{ success: boolean }>(`/api/v1/conversations/${id}`, {
    method: 'DELETE'
  });
}
