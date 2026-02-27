"use client";

import { useTranslations } from "next-intl";
import { Bot, SendHorizontal, Sparkles, Mic, Info } from "lucide-react";
import { useState, useRef } from "react";

type Message = { role: "ai" | "user"; text: string };

export default function AiChatPage() {
  const t = useTranslations("AiChat");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: t("greeting") },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const prompts = [t("prompt1"), t("prompt2"), t("prompt3")];

  const handleSend = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: msg },
      { role: "ai", text: t("comingSoon") },
    ]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="flex flex-col pb-44 bg-[#f4f6fa] md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Hero */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-9 md:px-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Birga Quramiz</p>
                <span className="rounded-lg bg-[#E31E24] px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">{t("beta")}</span>
              </div>
              <h1 className="text-2xl font-black text-white md:text-3xl">{t("title")}</h1>
              <p className="mt-2 max-w-xl text-[13px] text-white/70 md:text-[14px]">{t("subtitle")}</p>
            </div>
            <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Bot className="size-8 text-white" />
            </div>
          </div>

          {/* Main layout */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-start">

            {/* Sidebar */}
            <aside className="md:w-56 shrink-0">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{t("quickPrompts")}</p>
                <div className="space-y-2">
                  {prompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="w-full flex items-start gap-2.5 rounded-2xl border border-[#1B4D91]/10 bg-[#f4f6fa] px-3.5 py-3 text-left text-[12px] font-semibold text-[#1B4D91] hover:bg-[#1B4D91]/5 active:bg-[#1B4D91]/10 transition-colors"
                    >
                      <Sparkles className="size-3.5 mt-0.5 shrink-0 text-[#f9b41b]" />
                      {p}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#E31E24]/5 border border-[#E31E24]/10 p-3">
                  <Info className="size-3.5 text-[#E31E24] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-[#E31E24] leading-snug">{t("comingSoon")}</p>
                </div>
              </div>
            </aside>

            {/* Chat area */}
            <div className="flex flex-col flex-1 rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden" style={{ minHeight: 420 }}>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "ai" && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[#1B4D91] mt-0.5">
                        <Bot className="size-4" />
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed font-medium ${msg.role === "ai" ? "rounded-tl-sm bg-[#1B4D91]/8 text-[#1B4D91]" : "rounded-tr-sm bg-[#1B4D91] text-white"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-slate-100 px-4 py-4 flex items-center gap-3">
                <button className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-[#1B4D91] hover:border-[#1B4D91]/30 transition-colors">
                  <Mic className="size-[18px]" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  placeholder={t("inputPlaceholder")}
                  className="h-10 flex-1 rounded-2xl border-2 border-[#1B4D91]/15 bg-[#f4f6fa] px-4 text-[13px] font-semibold text-[#1B4D91] placeholder:font-normal placeholder:text-slate-400 focus:border-[#1B4D91]/40 focus:bg-white focus:outline-none transition-all"
                />
                <button
                  onClick={() => handleSend(input)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91] text-white hover:bg-[#163d73] active:scale-90 transition-all"
                >
                  <SendHorizontal className="size-[18px]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
