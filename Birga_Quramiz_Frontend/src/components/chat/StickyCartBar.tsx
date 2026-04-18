'use client';

import { useTranslations } from 'next-intl';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProjectStore } from '@/store/projectStore';

export function StickyCartBar() {
  const t = useTranslations('AiChat');
  const { products, materials } = useProjectStore();
  const addItemWithQuantity = useCartStore((s) => s.addItemWithQuantity);
  const getQuantity = useCartStore((s) => s.getQuantity);

  const cartableProducts = products.filter((p) => p.id);
  const notInCart = cartableProducts.filter((p) => getQuantity(p.id!) === 0);
  if (cartableProducts.length === 0 && materials.length === 0) return null;

  function handleAddAll() {
    notInCart.forEach((p) => {
      const price = parseFloat(p.price.replace(/[^\d.]/g, '')) || 0;
      const needed = p.quantity ?? 1;
      const available = p.stockCount ?? needed;
      const qty = Math.max(1, Math.min(needed, available));
      addItemWithQuantity(
        { id: p.id!, name: p.name, price, image: p.imageUrl ?? '' },
        qty,
      );
    });
  }

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {materials.length > 0 && (
          <p className="text-xs font-semibold text-foreground truncate">
            {t('materialsEstimated', { count: materials.length })}
          </p>
        )}
        {cartableProducts.length > 0 && (
          <p className="text-[10px] text-muted-foreground truncate">
            {t('productsReadyToAdd', { count: cartableProducts.length })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/cart"
          className="flex items-center gap-1 h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          {t('cartLabel')} <ChevronRight className="w-4 h-4" />
        </a>
        {notInCart.length > 0 && (
          <button
            onClick={handleAddAll}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            {t('addAllLabel', { count: notInCart.length })}
          </button>
        )}
      </div>
    </div>
  );
}
