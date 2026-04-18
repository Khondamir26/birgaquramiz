'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Calculator,
  HardHat,
  ChevronRight,
  LogIn,
} from 'lucide-react';

import { useCartStore } from '@/store/cartStore';
import type { AiAction, AiProduct } from '@/lib/chat/types';

const iconMap: Record<string, React.ReactNode> = {
  add_to_cart: <ShoppingCart className="w-4 h-4" />,
  calculate: <Calculator className="w-4 h-4" />,
  find_builder: <HardHat className="w-4 h-4" />,
  sign_in: <LogIn className="w-4 h-4" />,
};

const styleMap: Record<string, string> = {
  add_to_cart:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  calculate:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  find_builder:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  sign_in:
    'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
};

const defaultStyle =
  'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border';

interface Props {
  actions: AiAction[];
  products: AiProduct[];
  onSuggestion: (text: string) => void;
}

export function ActionButtons({ actions, products, onSuggestion }: Props) {
  const t = useTranslations('AiChat');
  const router = useRouter();
  const addItemWithQuantity = useCartStore((s) => s.addItemWithQuantity);

  const parsePrice = (price: string): number => {
    return parseFloat(price.replace(/[^\d.]/g, '')) || 0;
  };

  const handle = useCallback(
    (type: string) => {
      switch (type) {
        case 'add_to_cart':
          products.forEach((p) => {
            if (!p.id) return;

            const price = parsePrice(p.price);
            const needed = p.quantity ?? 1;
            const available = p.stockCount ?? needed;
            const qty = Math.max(1, Math.min(needed, available));

            addItemWithQuantity(
              {
                id: p.id,
                name: p.name,
                price,
                image: p.imageUrl ?? '',
              },
              qty
            );
          });
          break;

        case 'find_builder':
          router.push('/builders');
          break;

        case 'sign_in':
          router.push('/login');
          break;

        case 'calculate':
          onSuggestion(t('refineCalculation'));
          break;

        default:
          break;
      }
    },
    [products, addItemWithQuantity, router, onSuggestion, t]
  );

  // ✅ AFTER all hooks
  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((a, i) => {
        const isDisabled =
          a.type === 'add_to_cart' && products.length === 0;

        return (
          <button
            key={i}
            onClick={() => handle(a.type)}
            disabled={isDisabled}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              styleMap[a.type] ?? defaultStyle
            }`}
          >
            {iconMap[a.type] ?? (
              <ChevronRight className="w-4 h-4" />
            )}
            {a.label}
          </button>
        );
      })}
    </div>
  );
}