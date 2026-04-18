'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Package, CheckCircle2, Zap, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import type { AiProduct } from '@/lib/chat/types';

export function ProductCard({ product, isBest }: { product: AiProduct; isBest?: boolean }) {
  const t = useTranslations('AiChat');
  const addItemWithQuantity = useCartStore((s) => s.addItemWithQuantity);
  const getQuantity = useCartStore((s) => s.getQuantity);
  const inCart = product.id ? getQuantity(product.id) > 0 : false;
  const [imgError, setImgError] = useState(false);

  function handleAddToCart() {
    if (!product.id) return;
    const priceNum = parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
    const needed = product.quantity ?? 1;
    const available = product.stockCount ?? needed;
    const qty = Math.min(needed, available);
    addItemWithQuantity(
      { id: product.id, name: product.name, price: priceNum, image: product.imageUrl ?? '' },
      Math.max(1, qty),
    );
  }

  const showImage = !!product.imageUrl && !imgError;
  const priceParts = product.price.match(/^([\d\s]+)\s+([A-Z]+)$/);
  const priceNumber = priceParts?.[1] ?? product.price;
  const priceUnit = priceParts?.[2] ?? '';

  return (
    <div className="surface-card flex items-stretch gap-3 px-3 py-3">

      {/* Image */}
      <div className="size-14 shrink-0 self-center rounded-xl overflow-hidden flex items-center justify-center bg-muted border border-border">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl!}
            alt={product.name}
            className="object-contain w-full h-full p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <Package className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Middle: name+reason top / price+stock bottom */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-foreground line-clamp-1 leading-snug">{product.name}</p>
            {isBest && (
              <span className="inline-flex items-center gap-0.5 rounded bg-accent/10 px-1.5 py-0.5 shrink-0">
                <Zap className="w-2.5 h-2.5 fill-accent text-accent" />
                <span className="text-[9px] font-black text-accent">{t('bestPrice')}</span>
              </span>
            )}
          </div>
          {product.reason && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.reason}</p>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-black text-foreground leading-none">{priceNumber}</span>
            <span className="text-xs font-medium text-muted-foreground">{priceUnit}</span>
            {product.quantity && product.quantity > 1 && (
              <span className="text-xs font-medium text-primary">×{product.quantity}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {(() => {
              const needed = product.quantity ?? 0;
              const count = product.stockCount ?? (product.inStock ? 1 : 0);
              const insufficient = needed > 1 && count > 0 && count < needed;
              const outOfStock = product.inStock === false || count === 0;
              return (
                <>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${outOfStock ? 'bg-destructive' : insufficient ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                  <span className={`text-[10px] font-medium ${outOfStock ? 'text-destructive' : insufficient ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {outOfStock
                      ? t('outOfStock')
                      : insufficient
                        ? t('stockInsufficient', { count, needed })
                        : product.stockCount
                          ? t('stockAvailable', { count: product.stockCount })
                          : t('inStock')}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Right: two equal buttons, vertically centered */}
      <div className="flex flex-col justify-center gap-2 shrink-0">
        <Link
          href={`/product/${product.slug}`}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <span className="text-sm font-medium whitespace-nowrap">{t('viewProduct')}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>

        {product.id && (
          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl transition-all active:scale-95 ${
              inCart
                ? 'bg-emerald-500/15 text-emerald-600'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {inCart ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            <span className="text-sm font-medium whitespace-nowrap">
              {inCart ? t('inCartLabel') : t('addToCartLabel')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
