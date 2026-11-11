'use client';

import { Minus, Plus } from 'lucide-react';
import type { MenuItemDto } from '@coastline/api-contracts';
import { formatMoney } from '@/lib/format';
import { MAX_FOOD_ITEM_QUANTITY, MAX_FOOD_ORDER_LINES } from '@/lib/dining/delivery';
import { cn } from '@/lib/cn';

export interface FoodCartProps {
  items: MenuItemDto[];
  quantities: Record<string, number>;
  onChange: (menuItemId: string, quantity: number) => void;
  disabled?: boolean;
}

/**
 * Available menu items with +/- steppers. Limits mirror the API contract
 * (quantity 1..MAX_FOOD_ITEM_QUANTITY, at most MAX_FOOD_ORDER_LINES items);
 * the API still validates and prices every line itself.
 */
export function FoodCart({ items, quantities, onChange, disabled = false }: FoodCartProps) {
  const lineCount = Object.values(quantities).filter((q) => q > 0).length;
  const linesFull = lineCount >= MAX_FOOD_ORDER_LINES;

  return (
    <div>
      <ul className="divide-y divide-line rounded-xl border border-line" aria-label="Menu">
        {items.map((item) => {
          const quantity = quantities[item.id] ?? 0;
          const canAdd =
            !disabled && quantity < MAX_FOOD_ITEM_QUANTITY && (quantity > 0 || !linesFull);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-foam">{item.name}</p>
                <p className="font-mono text-[10.5px] text-mist">
                  {formatMoney(item.priceMinor)}
                  {item.nameBn ? <span className="ml-2 font-sans">{item.nameBn}</span> : null}
                </p>
              </div>
              <div className="flex flex-none items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Remove one ${item.name}`}
                  disabled={disabled || quantity === 0}
                  onClick={() => onChange(item.id, quantity - 1)}
                  className={stepperClass}
                >
                  <Minus aria-hidden className="h-3.5 w-3.5" />
                </button>
                <span
                  className={cn(
                    'w-6 text-center font-mono text-[13px]',
                    quantity > 0 ? 'text-foam' : 'text-mist/60',
                  )}
                  aria-live="polite"
                  aria-label={`${item.name} quantity`}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Add one ${item.name}`}
                  disabled={!canAdd}
                  onClick={() => onChange(item.id, quantity + 1)}
                  className={stepperClass}
                >
                  <Plus aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[10.5px] text-mist">
        Up to {MAX_FOOD_ITEM_QUANTITY} of each item and {MAX_FOOD_ORDER_LINES} different items per
        order.
      </p>
    </div>
  );
}

const stepperClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong text-foam transition-colors hover:border-sea/60 hover:bg-raised focus-visible:outline-2 focus-visible:outline-sea/70 disabled:cursor-not-allowed disabled:opacity-40';
