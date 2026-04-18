'use client';

import { useTranslations } from 'next-intl';
import { Package, Zap } from 'lucide-react';
import type { AiMaterial } from '@/lib/chat/types';

export function MaterialsList({ materials }: { materials: AiMaterial[] }) {
  const t = useTranslations('AiChat');

  if (materials.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-black uppercase tracking-widest text-primary">
            {t('materialsEstimate')}
          </span>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5">
          <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">
            {t('aiEstimate')}
          </span>
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/60">
        {materials.map((m, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <span className="text-[11px] font-black">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
              {m.reason && (
                <p className="text-xs text-muted-foreground truncate">{m.reason}</p>
              )}
            </div>
            <div className="shrink-0 flex items-baseline gap-1 rounded-xl bg-secondary px-3 py-1.5">
              <span className="text-sm font-black text-primary">{m.quantity}</span>
              <span className="text-xs font-medium text-muted-foreground">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 border-t border-border/60 bg-amber-50/50">
        <p className="text-[9px] text-amber-700/70 font-medium">
          {t('estimateDisclaimer')}
        </p>
      </div>
    </div>
  );
}
