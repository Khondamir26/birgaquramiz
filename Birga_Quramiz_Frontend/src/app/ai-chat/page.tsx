"use client";

import { useTranslations } from "next-intl";
import { Bot, SendHorizontal, Sparkles, Mic, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useProject } from "@/hooks/useProject";
import { useChatStore } from "@/store/chatStore";
import { useProjectStore } from "@/store/projectStore";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ProjectPanel } from "@/components/project/ProjectPanel";
import { QuotaNudge } from "@/components/chat/QuotaNudge";

export default function AiChatPage() {
  const t = useTranslations("AiChat");
  const { messages, loading, send, remaining } = useChat();
  const { updateFromText } = useProject();
  const { addMessage, clear } = useChatStore();
  const resetProject = useProjectStore((s) => s.reset);

  function handleClear() {
    clear();
    resetProject();
    addMessage({ role: "ai", text: String(t("greeting")) });
  }

  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);

  const prompts = [t("prompt1"), t("prompt2"), t("prompt3")];

  useEffect(() => {
    function init() {
      if (useChatStore.getState().messages.length === 0) {
        addMessage({ role: "ai", text: String(t("greeting")) });
      }
      setMounted(true);
    }

    if (useChatStore.persist.hasHydrated()) {
      init();
    } else {
      const unsub = useChatStore.persist.onFinishHydration(init);
      return unsub;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const INPUT_MAX = 2000;

  async function handleSend(text: string) {
    const msg = text.trim();
    if (!msg || loading || msg.length > INPUT_MAX) return;
    setInput("");
    updateFromText(msg);
    await send(msg);
  }

  return (
    <div className="flex flex-col pb-44 bg-background md:pb-12">
      <div className="mx-auto w-full md:max-w-[1488px]">
        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Hero */}
          <div className="rounded-3xl bg-primary px-6 py-9 md:px-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground/50">
                  Birga Quramiz
                </p>
                <span className="rounded-lg bg-accent px-2 py-0.5 text-[9px] font-black text-accent-foreground uppercase tracking-wider">
                  {t("beta")}
                </span>
              </div>
              <h1 className="text-2xl font-black text-primary-foreground md:text-3xl">{t("title")}</h1>
              <p className="mt-2 max-w-xl text-[13px] text-primary-foreground/70 md:text-sm">
                {t("subtitle")}
              </p>
            </div>
            <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <Bot className="size-8 text-primary-foreground" />
            </div>
          </div>

          {/* Main layout */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-start">

            {/* Sidebar */}
            <aside className="md:w-56 shrink-0 space-y-3">
              <div className="surface-card p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                  {t("quickPrompts")}
                </p>
                <div className="space-y-2">
                  {prompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      disabled={loading}
                      className="w-full flex items-start gap-2.5 rounded-2xl border border-border bg-background px-3.5 py-3 text-left text-xs font-medium text-primary hover:bg-secondary hover:border-primary/20 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="size-3.5 mt-0.5 shrink-0 text-amber-500" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <ProjectPanel />
            </aside>

            {/* Chat area */}
            <div
              className="flex flex-col flex-1 rounded-3xl bg-card border border-border shadow-sm overflow-hidden"
              style={{ minHeight: 420 }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("chatLabel")}
                </span>
                {messages.length > 1 && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    {t("clearChat")}
                  </button>
                )}
              </div>

              {mounted && (
                <ChatContainer
                  messages={messages}
                  loading={loading}
                  thinkingLabel={String(t("thinking"))}
                  onSuggestion={handleSend}
                />
              )}

              {remaining !== null && remaining <= 5 && (
                <QuotaNudge remaining={remaining} />
              )}

              {/* Input */}
              <div className="border-t border-border px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                    <Mic className="size-[18px]" />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(input)}
                    placeholder={String(t("inputPlaceholder"))}
                    disabled={loading}
                    maxLength={INPUT_MAX}
                    className={`h-10 flex-1 rounded-2xl border bg-background px-4 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none transition-all disabled:opacity-60 ${
                      input.length > INPUT_MAX * 0.9
                        ? 'border-destructive/60 focus:border-destructive'
                        : 'border-border focus:border-primary/40 focus:bg-card'
                    }`}
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={loading || !input.trim() || input.length > INPUT_MAX}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="size-[18px] animate-spin" />
                    ) : (
                      <SendHorizontal className="size-[18px]" />
                    )}
                  </button>
                </div>
                {input.length > INPUT_MAX * 0.9 && (
                  <p className="text-[10px] text-right pr-14 text-destructive font-medium">
                    {input.length} / {INPUT_MAX}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
