import { t } from '../../messages/t';
import { WhatsAppGlyph } from './icons';

export function WhatsAppFab() {
  return (
    <a
      href="/contact"
      className="bg-botanical text-ivory hover:bg-botanical/90 fixed right-3 bottom-32 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-raised md:right-4 md:bottom-8"
      aria-label={t('nav.whatsapp')}
    >
      <WhatsAppGlyph />
    </a>
  );
}
