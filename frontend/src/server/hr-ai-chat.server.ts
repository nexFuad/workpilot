import { apiRequest } from './auth.server';

export type HrAiChatMessage = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};
export type HrAiConversation = { id: string; title: string; createdAt: string; updatedAt: string };

export const hrAiChatServer = {
  list: () => apiRequest<{ conversations: HrAiConversation[] }>('/api/hr/ai-chat/conversations'),
  get: (id: string) =>
    apiRequest<{ conversation: { id: string; title: string; messages: HrAiChatMessage[] } }>(
      `/api/hr/ai-chat/conversations/${id}`,
    ),
  send: (message: string, conversationId?: string) =>
    apiRequest<{ conversationId: string; reply: string; createdAt: string }>(
      '/api/hr/ai-chat/messages',
      {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      },
    ),
};
