import { Footer } from '@kairos/ui';

import type { FooterContent } from '../../content/contract';
import { t } from '../../messages/t';
import { BrandMark } from './BrandMark';
import { FacebookGlyph, InstagramGlyph, YoutubeGlyph } from './icons';

function SocialIcon({ platform }: { platform: string }) {
  if (platform === 'facebook') return <FacebookGlyph />;
  if (platform === 'instagram') return <InstagramGlyph />;
  if (platform === 'youtube') return <YoutubeGlyph />;
  return <span className="text-caption">{platform}</span>;
}

export function StorefrontFooter({ footer }: { footer: FooterContent }) {
  const links = footer.sections.flatMap((section) => section.links);

  return (
    <div className="storefront-footer-light">
      <Footer label={t('footer.label')}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <BrandMark compact />
          {links.length > 0 ? (
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 md:flex-nowrap">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    className="text-botanical text-body-sm"
                    target={link.opensInNewTab ? '_blank' : undefined}
                    rel={link.opensInNewTab ? 'noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-botanical/80">{t('empty.footer')}</p>
          )}
          <div className="flex flex-col items-start gap-3 md:items-end">
            {footer.social.length > 0 ? (
              <ul className="flex items-center gap-3" aria-label={t('footer.social')}>
                {footer.social.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      className="text-botanical inline-flex min-h-8 min-w-8 items-center justify-center"
                      aria-label={link.platform}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <SocialIcon platform={link.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-caption text-botanical/80">{t('footer.copyright')}</p>
          </div>
        </div>
      </Footer>
    </div>
  );
}
