'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Zap } from 'lucide-react';

interface Props {
  remaining: number;
}

export function QuotaNudge({ remaining }: Props) {
  const t = useTranslations('AiChat');

  if (remaining > 5) return null;

  const isExhausted = remaining === 0;

  return (
    <div className={`mx-4 mb-3 rounded-2xl border px-4 py-3 flex items-center gap-3 ${
      isExhausted
        ? 'border-destructive/30 bg-destructive/5'
        : 'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20'
    }`}>
      <Zap className={`size-4 shrink-0 ${isExhausted ? 'text-destructive' : 'text-amber-500'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${isExhausted ? 'text-destructive' : 'text-amber-800 dark:text-amber-400'}`}>
          {isExhausted ? t('quotaExhaustedTitle') : t('quotaNudgeTitle', { count: remaining })}
        </p>
        <p className={`text-[11px] mt-0.5 ${isExhausted ? 'text-destructive/70' : 'text-amber-600 dark:text-amber-500'}`}>
          {t('quotaNudgeSubtitle')}
        </p>
      </div>
      <Link
        href="/login"
        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-colors ${
          isExhausted ? 'bg-destructive hover:bg-destructive/90' : 'bg-amber-500 hover:bg-amber-600'
        }`}
      >
        {t('quotaNudgeCta')}
      </Link>
    </div>
  );
}
