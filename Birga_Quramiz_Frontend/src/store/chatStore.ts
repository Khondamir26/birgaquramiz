import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage } from '@/lib/chat/types';

export const TTL_MS = 60 * 60 * 1000; // 1 hour sliding window

let idCounter = 0;
export const newId = () => `${Date.now()}-${++idCounter}`;
const generateSessionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type ChatState = {
  messages: ChatMessage[];
  sessionId: string;
  loading: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  setLoading: (v: boolean) => void;
  clear: () => void;
  checkAndResetIfExpired: () => boolean;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      sessionId: generateSessionId(),
      loading: false,

      addMessage: (msg) => {
        const full: ChatMessage = { ...msg, id: newId(), timestamp: Date.now() };
        set((state) => ({ messages: [...state.messages, full] }));
        return full;
      },

      setLoading: (loading) => set({ loading }),

      clear: () => set({ messages: [], loading: false, sessionId: generateSessionId() }),

      checkAndResetIfExpired: () => {
        const last = get().messages.at(-1);
        const expired = !!last && Date.now() - last.timestamp > TTL_MS;
        if (expired) {
          // Single atomic set — no race window between check and clear
          set({ messages: [], loading: false, sessionId: generateSessionId() });
        }
        return expired;
      },
    }),
    {
      name: 'chat-history',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ messages: state.messages, sessionId: state.sessionId }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const last = state.messages.at(-1);
        if (last && Date.now() - last.timestamp > TTL_MS) {
          useChatStore.getState().clear();
        }
      },
    },
  ),
);
