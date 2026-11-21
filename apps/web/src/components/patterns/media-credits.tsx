import { MEDIA_CREDITS } from '@/lib/media-credits';

export function MediaCreditsList() {
  return (
    <div className="mt-8 border-t border-white/15 pt-6 text-xs leading-relaxed text-white/70">
      <p className="font-semibold text-white/90">Photo and video credits (Wikimedia Commons):</p>
      <p className="mt-2 text-white/60">
        {MEDIA_CREDITS.map((credit, idx) => (
          <span key={credit.file}>
            {idx > 0 ? ' · ' : null}
            <a
              href={credit.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6FD3E6] hover:text-white hover:underline"
            >
              {credit.source_title.replace(/\.(jpe?g|webm|png|webp)$/i, '')}
            </a>{' '}
            by {credit.author || 'unknown'} ({credit.license})
          </span>
        ))}
      </p>
    </div>
  );
}
