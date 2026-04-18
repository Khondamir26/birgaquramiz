'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import { MaterialsList } from './MaterialsList';
import { ProductCard } from './ProductCard';
import { ActionButtons } from './ActionButtons';
import { Suggestions } from './Suggestions';
import { ChatInputBlock } from './ChatInputBlock';
import type { AiStructuredResponse } from '@/lib/chat/types';

const MAX_PRODUCTS = 4;

function TotalPrice({ products, label }: { products: AiStructuredResponse['products']; label: string }) {
  const total = products.reduce((sum, p) => {
    if (!p.quantity || p.quantity < 1) return sum;
    const price = parseFloat(p.price.replace(/[^\d.]/g, '')) || 0;
    const needed = p.quantity;
    const available = p.stockCount ?? needed;
    const qty = Math.min(needed, available);
    return sum + price * qty;
  }, 0);

  if (total === 0) return null;
  const formatted = Math.round(total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3 border border-border">
      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-[18px] font-black text-foreground">{formatted}</span>
        <span className="text-xs font-medium text-muted-foreground">UZS</span>
      </div>
    </div>
  );
}

const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-1.5 last:mb-0 text-sm leading-relaxed font-medium text-foreground">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="ml-4 mt-1 mb-1.5 space-y-0.5 list-disc">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="ml-4 mt-1 mb-1.5 space-y-0.5 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="underline underline-offset-2 font-semibold text-primary hover:opacity-75 transition-opacity">
      {children}
    </a>
  ),
};

interface Props {
  structured: AiStructuredResponse;
  onSuggestion: (text: string) => void;
  isLatest?: boolean;
  loading?: boolean;
}

export function MessageRenderer({ structured, onSuggestion, isLatest, loading }: Props) {
  const t = useTranslations('AiChat');
  const { message, materials, products, actions, suggestions, inputRequest } = structured;
  const visibleProducts = products.slice(0, MAX_PRODUCTS);
  const productRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLatest && visibleProducts.length > 0 && productRef.current) {
      productRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isLatest, visibleProducts.length]);

  const showTotal = materials.length > 0 && visibleProducts.some((p) => p.quantity && p.quantity >= 1);

  // When an inputRequest is present, suppress suggestions — the input block IS the interaction
  const showSuggestions = !inputRequest && suggestions.length > 0;

  return (
    <div className="space-y-3 text-foreground font-medium">
      {message && (
        <ReactMarkdown components={mdComponents}>{String(message)}</ReactMarkdown>
      )}

      <MaterialsList materials={materials} />

      {visibleProducts.length > 0 && (
        <div ref={productRef} className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('suggestedProducts')}
          </p>
          <div className="flex flex-col gap-2">
            {visibleProducts.map((p, i) => (
              <ProductCard
                key={p.slug}
                product={p}
                isBest={i === 0 && visibleProducts.length > 1}
              />
            ))}
          </div>
          {products.length > MAX_PRODUCTS && (
            <p className="text-xs text-muted-foreground text-center">
              {t('moreProducts', { count: products.length - MAX_PRODUCTS })} —{' '}
              <a href="/marketplace" className="underline font-semibold text-primary">
                {t('browseMarketplace')}
              </a>
            </p>
          )}
        </div>
      )}

      {showTotal && <TotalPrice products={visibleProducts} label={t('estimatedTotal')} />}

      <ActionButtons actions={actions} products={visibleProducts} onSuggestion={onSuggestion} />

      {/* Input block replaces question-chips when AI needs a specific value */}
      {isLatest && inputRequest && (
        <ChatInputBlock
          inputRequest={inputRequest}
          onSubmit={onSuggestion}
          disabled={loading}
        />
      )}

      {showSuggestions && (
        <Suggestions suggestions={suggestions} onSelect={onSuggestion} />
      )}
    </div>
  );
}
