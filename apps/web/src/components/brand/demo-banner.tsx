export function DemoBanner() {
  return (
    <div className="relative z-[60] flex h-[var(--banner-height)] items-center justify-center gap-2 overflow-hidden border-b border-line bg-deep/95 px-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-mist">
      <span aria-hidden className="h-1 w-1 rounded-full bg-coral" />
      Demo environment — prices, payments and tickets are simulated
    </div>
  );
}
