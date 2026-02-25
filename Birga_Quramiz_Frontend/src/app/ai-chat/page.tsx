"use client";

import { Bot, Mic, SendHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";

const suggestions = ["Estimate a 2-floor house", "Suggest materials for foundation", "Compare cement M400 vs M500"];

export default function AiChatPage() {
  const [message, setMessage] = useState("");

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title text-primary">AI Construction Consultant</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          24/7 text and voice assistant for estimate planning, material selection and project guidance.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.7fr,1.3fr]">
        <aside className="surface-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick prompts</h2>
          <div className="mt-3 space-y-2">
            {suggestions.map((item) => (
              <button key={item} onClick={() => setMessage(item)} className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-left text-sm text-muted-foreground hover:border-primary/35 hover:text-primary">
                <Sparkles className="mr-2 inline size-4 text-accent" />
                {item}
              </button>
            ))}
          </div>
        </aside>

        <div className="surface-card flex min-h-[420px] flex-col p-5">
          <div className="space-y-3">
            <div className="w-fit rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm text-primary">
              <Bot className="mr-2 inline size-4" />
              Hello. I can help with estimates, equipment selection and budget planning.
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 border-t border-border/70 pt-4">
            <button className="rounded-lg border border-border/80 bg-white p-2 text-muted-foreground hover:text-primary">
              <Mic className="size-4" />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about materials, quantities or scheduling"
              className="h-10 flex-1 rounded-lg border border-border/80 bg-white px-3 text-sm outline-none ring-ring/20 focus:ring-2"
            />
            <button className="rounded-lg bg-primary p-2 text-white hover:bg-primary/90">
              <SendHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
