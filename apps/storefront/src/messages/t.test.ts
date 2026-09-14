import { describe, expect, it } from 'vitest';

import { t } from './t';

describe('t', () => {
  it('returns French chrome copy for a known key', () => {
    expect(t('nav.home')).toBe('Accueil');
  });

  it('interpolates placeholders', () => {
    expect(t('carousel.slide', { page: 2, total: 4 })).toBe('Diapositive 2 sur 4');
  });
});
