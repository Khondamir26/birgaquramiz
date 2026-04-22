import type { AiStructuredResponse, ProjectContext } from '@/lib/chat/types';

export type { AiMaterial, AiProduct, AiAction, AiStructuredResponse } from '@/lib/chat/types';

const API = process.env.NEXT_PUBLIC_AI_URL ?? 'https://ai.birga-quramiz.uz';

export interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export async function sendChatMessage(
  messages: ApiChatMessage[],
  locale: string,
  projectContext?: ProjectContext,
  sessionId?: string,
): Promise<AiStructuredResponse> {
  const res = await fetch(`${API}/ai/chat`, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, locale, projectContext, sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { message?: string }).message ?? 'AI service unavailable';
    if (res.status === 429) throw new QuotaExceededError(message);
    throw new Error(message);
  }

  const data = await res.json() as AiStructuredResponse;
  return {
    message: data.message ?? String((data as unknown as { reply?: string }).reply ?? ''),
    materials: data.materials ?? [],
    products: data.products ?? [],
    actions: data.actions ?? [],
    suggestions: (data.suggestions ?? []).map((s) =>
      typeof s === 'string' ? s : ((s as { label?: string }).label ?? String(s))
    ),
    inputRequest: data.inputRequest,
    remaining: typeof data.remaining === 'number' ? data.remaining : undefined,
  };
}
