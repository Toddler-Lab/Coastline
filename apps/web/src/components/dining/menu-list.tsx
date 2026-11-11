import type { MenuCategoryDto } from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/states';
import { formatDiningPrice } from './dining-format';

/** Menu grouped by category; unavailable items stay visible but greyed out. */
export function MenuList({ menu }: { menu: MenuCategoryDto[] }) {
  const categories = menu.filter((category) => category.items.length > 0);

  if (categories.length === 0) {
    return (
      <EmptyState
        title="Menu not published yet"
        body="This venue has not listed any dishes in the demo catalogue yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {categories.length > 1 ? (
        <nav aria-label="Menu categories" className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#menu-${category.id}`}
              className="inline-flex min-h-9 items-center rounded-lg bg-surface px-3 py-1.5 text-[12px] font-medium text-mist transition-colors hover:bg-raised hover:text-foam"
            >
              {category.name}
            </a>
          ))}
        </nav>
      ) : null}

      {categories.map((category) => (
        <Panel
          key={category.id}
          id={`menu-${category.id}`}
          className="scroll-mt-24 p-5"
          aria-labelledby={`menu-${category.id}-title`}
          role="region"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <h3 id={`menu-${category.id}-title`} className="text-[16px] font-semibold text-foam">
              {category.name}
            </h3>
            {category.nameBn ? (
              <span className="text-[13px] text-mist" lang="bn">
                {category.nameBn}
              </span>
            ) : null}
          </div>

          <ul className="divide-y divide-line">
            {category.items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'flex items-start justify-between gap-4 py-3',
                  !item.isAvailable && 'opacity-50',
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[14px] font-medium text-foam',
                      !item.isAvailable && 'line-through decoration-mist/60',
                    )}
                  >
                    {item.name}
                  </p>
                  {item.nameBn ? (
                    <p className="text-[12px] text-mist" lang="bn">
                      {item.nameBn}
                    </p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-1 text-[12px] leading-relaxed text-mist">{item.description}</p>
                  ) : null}
                  {!item.isAvailable ? (
                    <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-warn">
                      Unavailable today
                    </p>
                  ) : null}
                </div>
                <p className="flex-none font-mono text-[14px] font-semibold text-foam">
                  {formatDiningPrice(item.priceMinor, item.currency)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      <p className="text-[11.5px] text-mist">
        Prices are indicative demo prices in BDT, not a legally authoritative tariff. No real
        payment is taken anywhere in this demo.
      </p>
    </div>
  );
}
