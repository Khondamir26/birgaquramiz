'use client';

import { X, RotateCcw, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useProject } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import { useCartStore } from '@/store/cartStore';

export function ProjectPanel() {
  const t = useTranslations('AiChat');
  const { context, setField, reset, hasContext } = useProject();
  const { materials, products } = useProjectStore();
  const addItemWithQuantity = useCartStore((s) => s.addItemWithQuantity);

  if (!hasContext()) return null;

  const cartableProducts = products.filter((p) => p.id);

  function handleAddAllToCart() {
    cartableProducts.forEach((p) => {
      const price = parseFloat(p.price.replace(/[^\d.]/g, '')) || 0;
      const needed = p.quantity ?? 1;
      const available = p.stockCount ?? needed;
      const qty = Math.max(1, Math.min(needed, available));
      addItemWithQuantity({ id: p.id!, name: p.name, price, image: p.imageUrl ?? '' }, qty);
    });
  }

  const contextEntries = [
    context.type     && { key: 'type',     label: t('typeLabel'),     value: context.type,                                 onRemove: () => setField('type', undefined) },
    context.area     && { key: 'area',     label: t('areaLabel'),     value: `${context.area} m²`,                         onRemove: () => setField('area', undefined) },
    context.budget   && { key: 'budget',   label: t('budgetLabel'),   value: `${context.budget.toLocaleString('ru-RU')} UZS`, onRemove: () => setField('budget', undefined) },
    context.location && { key: 'location', label: t('locationLabel'), value: context.location,                              onRemove: () => setField('location', undefined) },
  ].filter(Boolean) as { key: string; label: string; value: string; onRemove: () => void }[];

  return (
    <div className="surface-card p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          {t('yourProject')}
        </span>
        <button
          onClick={reset}
          className="flex items-center gap-0.5 text-[9px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
        >
          <RotateCcw className="size-2.5" />
          {t('reset')}
        </button>
      </div>

      {/* Context tags */}
      {contextEntries.length > 0 && (
        <div className="rounded-xl border border-border bg-background divide-y divide-border overflow-hidden">
          {contextEntries.map(({ key, label, value, onRemove }) => (
            <div key={key} className="flex items-center justify-between px-2.5 py-2 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-muted-foreground leading-none mb-0.5">{label}</p>
                <p className="text-[12px] font-bold text-foreground leading-snug">{value}</p>
              </div>
              <button onClick={onRemove} className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Materials summary */}
      {materials.length > 0 && (
        <div className="rounded-xl bg-primary/5 px-2.5 py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-primary/70 mb-1">
            {t('materialsCount', { count: materials.length })}
          </p>
          {materials.slice(0, 4).map((m, i) => (
            <div key={i} className="flex justify-between items-baseline gap-2">
              <span className="text-[10px] text-muted-foreground truncate">{m.name}</span>
              <span className="text-[10px] font-bold text-primary shrink-0">{m.quantity} {m.unit}</span>
            </div>
          ))}
          {materials.length > 4 && (
            <p className="text-[9px] text-muted-foreground pt-0.5">{t('moreItems', { count: materials.length - 4 })}</p>
          )}
        </div>
      )}

      {/* Add all to cart */}
      {cartableProducts.length > 0 && (
        <button
          onClick={handleAddAllToCart}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
        >
          <ShoppingCart className="size-3.5" />
          {t('addAllToCart', { count: cartableProducts.length })}
        </button>
      )}
    </div>
  );
}
