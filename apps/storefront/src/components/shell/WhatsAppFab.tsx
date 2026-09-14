import { t } from '../../messages/t';
import { WhatsAppGlyph } from './icons';

export function WhatsAppFab() {
  return (
    <a
      href="/contact"
      className="bg-whatsapp text-ivory hover:bg-whatsapp/90 fixed right-3 bottom-[4.5rem] z-50 inline-flex h-11 w-11 items-center justify-center rounded-full shadow-raised md:right-4 md:bottom-6 md:h-12 md:w-12"
      aria-label={t('nav.whatsapp')}
    >
      <WhatsAppGlyph />
    </a>
  );
}
