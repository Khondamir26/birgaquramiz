'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import type { InputRequest } from '@/lib/chat/types';

interface Props {
  inputRequest: InputRequest;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function ChatInputBlock({ inputRequest, onSubmit, disabled }: Props) {
  const t = useTranslations('AiChat');
  const [numValue, setNumValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRequest.type === 'number' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRequest.type]);

  function buildMessage(raw: string): string {
    if (inputRequest.unit) return `${raw} ${inputRequest.unit}`;
    return raw;
  }

  function submitNumber() {
    const v = numValue.trim();
    if (!v || isNaN(Number(v))) return;
    setSubmitted(true);
    onSubmit(buildMessage(v));
  }

  function submitSelect(value: string, label: string) {
    setSelected(value);
    setSubmitted(true);
    onSubmit(label);
  }

  if (submitted) return null;

  return (
    <div className="mt-2 rounded-2xl border border-primary/20 bg-secondary/40 p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {inputRequest.label}
      </p>

      {/* ── NUMBER INPUT ── */}
      {inputRequest.type === 'number' && (
        <div className="space-y-2.5">
          {/* Quick value chips */}
          {inputRequest.quickValues && inputRequest.quickValues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {inputRequest.quickValues.map((v) => (
                <button
                  key={v}
                  disabled={disabled}
                  onClick={() => setNumValue(String(v))}
                  className={`h-9 px-3.5 rounded-xl border text-sm font-medium transition-all ${
                    numValue === String(v)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-secondary'
                  }`}
                >
                  {v}
                  {inputRequest.unit && (
                    <span className="ml-0.5 text-xs opacity-60">{inputRequest.unit}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Text input row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="number"
                value={numValue}
                onChange={(e) => setNumValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitNumber()}
                disabled={disabled}
                placeholder={String(t('inputCustomPlaceholder'))}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 pr-12 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-card transition-all"
              />
              {inputRequest.unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                  {inputRequest.unit}
                </span>
              )}
            </div>
            <button
              onClick={submitNumber}
              disabled={disabled || !numValue.trim()}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95 shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── SELECT INPUT ── */}
      {inputRequest.type === 'select' && inputRequest.options && (
        <div className="flex flex-wrap gap-2">
          {inputRequest.options.map((opt) => (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => submitSelect(opt.value, opt.label)}
              className={`h-10 px-4 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                selected === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-secondary'
              }`}
            >
              {selected === opt.value && <Check className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ── TEXT INPUT ── */}
      {inputRequest.type === 'text' && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={numValue}
            onChange={(e) => setNumValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && numValue.trim()) {
                setSubmitted(true);
                onSubmit(numValue.trim());
              }
            }}
            disabled={disabled}
            placeholder={String(t('inputTextPlaceholder'))}
            className="flex-1 h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
          <button
            onClick={() => {
              if (!numValue.trim()) return;
              setSubmitted(true);
              onSubmit(numValue.trim());
            }}
            disabled={disabled || !numValue.trim()}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95 shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
