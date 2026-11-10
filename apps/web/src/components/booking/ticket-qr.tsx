'use client';

import QRCode from 'react-qr-code';

/**
 * Rendered as a printed ticket: dark QR on a warm paper card so it survives
 * printing (browsers drop the dark page background, the card does not).
 */
export function TicketQr({ payload, code }: { payload: string; code: string }) {
  return (
    <div className="rounded-2xl border border-[#d9ceb6] bg-[#f6f1e5] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] print:shadow-none [print-color-adjust:exact]">
      <QRCode
        value={payload}
        size={192}
        level="M"
        bgColor="#f6f1e5"
        fgColor="#041014"
        title={`Demo check-in ticket ${code}`}
        className="mx-auto h-auto w-full max-w-[192px]"
      />
      <div className="mt-3 border-t border-dashed border-[#b9ab90] pt-3 text-center">
        <p className="font-mono text-[14px] font-semibold tracking-[0.06em] text-[#041014]">
          {code}
        </p>
        <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#5a5445]">
          Manual check-in code
        </p>
      </div>
    </div>
  );
}
