import { t } from '../../messages/t';
import { LeafGlyph } from './icons';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className="flex min-h-11 items-center gap-3">
      <span className="relative text-botanical">
        <span className="font-serif text-h3 leading-none md:text-h2">
          Ka
          <span className="relative inline-block">
            i
            <LeafGlyph className="absolute -top-1.5 left-[42%] h-4 w-4 -translate-x-1/2 md:-top-2 md:h-5 md:w-5" />
          </span>
          ros
        </span>
        <span className="font-sans mt-1 block text-[0.65rem] font-semibold tracking-[0.32em] uppercase">
          {t('brand.distributions')}
        </span>
      </span>
      <span className="bg-beige hidden h-10 w-px shrink-0 md:block" aria-hidden="true" />
      <span
        className={
          compact
            ? 'text-botanical hidden max-w-28 text-caption leading-tight sm:block'
            : 'text-botanical max-w-28 text-caption leading-tight md:max-w-36'
        }
      >
        {t('brand.tagline')}
      </span>
    </a>
  );
}
