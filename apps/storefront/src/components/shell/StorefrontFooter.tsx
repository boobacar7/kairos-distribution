import { Footer } from '@kairos/ui';

import type { FooterContent } from '../../content/contract.js';
import { t } from '../../messages/t.js';

const LEGAL = [
  { href: '/livraison', key: 'footer.delivery' as const },
  { href: '/retours', key: 'footer.returns' as const },
  { href: '/faq', key: 'footer.faq' as const },
  { href: '/contact', key: 'footer.contact' as const },
  { href: '/confidentialite', key: 'footer.privacy' as const },
  { href: '/conditions', key: 'footer.terms' as const },
] as const;

export function StorefrontFooter({ footer }: { footer: FooterContent }) {
  const hasCms = footer.sections.length > 0 || footer.social.length > 0;

  return (
    <Footer label={t('footer.label')}>
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <p className="font-serif text-h3">{t('brand.fullName')}</p>
        </div>
        {footer.sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <p className="text-body-sm font-semibold tracking-wide uppercase">{section.title}</p>
            <ul className="space-y-1">
              {section.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    className="text-ivory/90 hover:text-ivory text-body-sm"
                    target={link.opensInNewTab ? '_blank' : undefined}
                    rel={link.opensInNewTab ? 'noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="space-y-2">
          <p className="text-body-sm font-semibold tracking-wide uppercase">{t('footer.legal')}</p>
          <ul className="space-y-1">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-ivory/90 hover:text-ivory text-body-sm">
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {footer.social.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {footer.social.map((link) => (
              <li key={link.id}>
                <a href={link.url} className="text-ivory/90 hover:text-ivory text-body-sm">
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {!hasCms ? <p className="text-body-sm text-ivory/80">{t('empty.footer')}</p> : null}
      </div>
    </Footer>
  );
}
