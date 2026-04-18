'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { sendChatMessage, QuotaExceededError, type ApiChatMessage } from '@/lib/api/ai';
import { useChatStore } from '@/store/chatStore';
import { useProjectStore } from '@/store/projectStore';
import type { ChatMessage } from '@/lib/chat/types';

const MAX_HISTORY = 20;

function toApiMessages(messages: ChatMessage[]): ApiChatMessage[] {
  return messages
    .filter((m, i) => !(i === 0 && m.role === 'ai'))
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    }));
}

const SOFT_RESET_MESSAGES: Record<string, { message: string; suggestions: string[] }> = {
  ru: { message: 'Начата новая сессия. Чем могу помочь?', suggestions: ['Рассчитать материалы', 'Найти товары', 'Найти строителя'] },
  uz: { message: 'Yangi sessiya boshlandi. Qanday yordam bera olaman?', suggestions: ['Materiallarni hisoblash', 'Mahsulot qidirish', 'Quruvchi topish'] },
  en: { message: "New session started. How can I help?", suggestions: ['Calculate materials', 'Search products', 'Find a builder'] },
};

function makeSoftResetMessage(locale: string) {
  const data = SOFT_RESET_MESSAGES[locale] ?? SOFT_RESET_MESSAGES['ru'];
  return {
    role: 'ai' as const,
    text: '',
    structured: { message: data.message, materials: [], products: [], actions: [], suggestions: data.suggestions },
  };
}

const QUOTA_EXCEEDED_MESSAGES: Record<string, { message: string; cta: string; info: string; suggestions: string[] }> = {
  ru: {
    message: 'Вы исчерпали бесплатные запросы на сегодня.',
    cta: 'Войти для продолжения',
    info: 'Зарегистрированные пользователи получают 200 запросов в день',
    suggestions: ['Попробовать завтра', 'Войти', 'Зарегистрироваться'],
  },
  uz: {
    message: "Bugungi bepul so'rovlar tugadi.",
    cta: 'Davom etish uchun kiring',
    info: "Ro'yxatdan o'tgan foydalanuvchilar kuniga 200 ta so'rov oladi",
    suggestions: ["Ertaga urinib ko'ring", 'Kirish', "Ro'yxatdan o'tish"],
  },
  en: {
    message: "You've used all your free requests for today.",
    cta: 'Sign in for more access',
    info: 'Registered users get 200 requests per day',
    suggestions: ['Try tomorrow', 'Sign in', 'Register'],
  },
};

const ERROR_MESSAGES: Record<string, { message: string; suggestions: string[] }> = {
  ru: { message: 'Что-то пошло не так. Попробуйте ещё раз.', suggestions: ['Попробовать снова', 'Найти материалы', 'Найти строителя'] },
  uz: { message: "Xatolik yuz berdi. Qaytadan urinib ko'ring.", suggestions: ['Qayta urinish', 'Material qidirish', 'Quruvchi topish'] },
  en: { message: 'Something went wrong. Please try again.', suggestions: ['Try again', 'Search for materials', 'Find a builder'] },
};

export function useChat() {
  const locale = useLocale();
  const { messages, loading, addMessage, setLoading } = useChatStore();
  const { context } = useProjectStore();
  const [remaining, setRemaining] = useState<number | null>(null);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;

    // 1. Atomic TTL check — happens before any state mutation
    const expired = useChatStore.getState().checkAndResetIfExpired();
    if (expired) {
      useProjectStore.getState().reset();
      addMessage(makeSoftResetMessage(locale));
    }

    // 2. Add user message AFTER reset notification so timeline is clean
    addMessage({ role: 'user', text: msg });

    // 3. Read history from store state directly — not from closure —
    //    so we never send pre-reset messages to the API.
    const currentMessages = useChatStore.getState().messages;
    const historyForApi = toApiMessages(currentMessages);

    setLoading(true);

    try {
      const { sessionId } = useChatStore.getState();
      const freshContext = useProjectStore.getState().context;
      const structured = await sendChatMessage(
        historyForApi,
        locale,
        Object.keys(freshContext).length > 0 ? freshContext : undefined,
        sessionId,
      );
      addMessage({ role: 'ai', text: structured.message, structured });

      if (typeof structured.remaining === 'number') {
        setRemaining(structured.remaining);
      }

      // Always sync project store — clear stale data from previous responses
      const { setMaterials, setProducts } = useProjectStore.getState();
      setMaterials(structured.materials);
      setProducts(structured.products);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        const q = QUOTA_EXCEEDED_MESSAGES[locale] ?? QUOTA_EXCEEDED_MESSAGES['ru'];
        setRemaining(0);
        addMessage({
          role: 'ai',
          text: '',
          structured: {
            message: `${q.message} ${q.info}.`,
            materials: [],
            products: [],
            actions: [{ type: 'sign_in', label: q.cta }],
            suggestions: q.suggestions,
          },
        });
      } else {
        const e = ERROR_MESSAGES[locale] ?? ERROR_MESSAGES['ru'];
        addMessage({
          role: 'ai',
          text: '',
          structured: { message: e.message, materials: [], products: [], actions: [], suggestions: e.suggestions },
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, send, remaining };
}
