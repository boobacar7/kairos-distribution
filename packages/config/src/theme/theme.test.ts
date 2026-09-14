import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  APPROVED_PAIRS,
  contrastRatio,
  isApprovedPair,
  meetsWcagAa,
  PALETTE,
  PALETTE_CSS_NAMES,
  paletteContrast,
  TYPEFACES,
  WCAG_AA_LARGE_TEXT,
  WCAG_AA_TEXT,
  WCAG_AA_UI,
} from './index.js';
import { PALETTE_HEXES } from './palette.js';

const THEME_CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../theme/kairos.css'),
  'utf8',
);

function normalizeHex(hex: string): string {
  return hex.toUpperCase();
}

describe('palette contract', () => {
  it('defines every spec §3 colour exactly once', () => {
    expect(PALETTE).toEqual({
      ivory: '#F8F5EF',
      beige: '#D8C5AD',
      botanical: '#173F32',
      softGreen: '#DCE4D1',
      powderPink: '#E7B5A6',
      coral: '#E86F5B',
      aubergine: '#3C2635',
      ink: '#18211D',
    });
    expect(new Set(PALETTE_HEXES).size).toBe(8);
  });

  it('writes each palette hex into the Tailwind @theme file', () => {
    for (const [name, hex] of Object.entries(PALETTE)) {
      const cssName = PALETTE_CSS_NAMES[name as keyof typeof PALETTE];
      const token = `--color-${cssName}:`;
      expect(THEME_CSS, `${name} missing from kairos.css`).toContain(token);
      const line = THEME_CSS.split('\n').find((entry) => entry.includes(token));
      expect(line?.toUpperCase()).toContain(normalizeHex(hex));
    }
  });

  it('does not introduce a hex that is not in the palette', () => {
    const hexes = THEME_CSS.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) ?? [];
    const allowed = new Set(PALETTE_HEXES.map(normalizeHex));
    for (const hex of hexes) {
      const expanded =
        hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
      expect(allowed.has(normalizeHex(expanded)), `undeclared hex ${hex} in kairos.css`).toBe(true);
    }
  });
});

describe('contrast matrix', () => {
  it('marks beige and powder pink on ivory as decorative because they fail AA text', () => {
    expect(paletteContrast('beige', 'ivory')).toBeLessThan(WCAG_AA_TEXT);
    expect(paletteContrast('powderPink', 'ivory')).toBeLessThan(WCAG_AA_TEXT);
    expect(paletteContrast('coral', 'ivory')).toBeLessThan(WCAG_AA_LARGE_TEXT);

    const decorativeOnIvory = APPROVED_PAIRS.filter(
      (pair) => pair.background === 'ivory' && pair.role === 'decorative',
    ).map((pair) => pair.foreground);

    expect(decorativeOnIvory).toEqual(expect.arrayContaining(['beige', 'powderPink', 'coral']));
  });

  it('every non-decorative approved pair actually meets the WCAG AA threshold for its role', () => {
    const failures: string[] = [];
    for (const pair of APPROVED_PAIRS) {
      if (pair.role === 'decorative') continue;
      const ratio = paletteContrast(pair.foreground, pair.background);
      if (!meetsWcagAa(ratio, pair.role)) {
        failures.push(
          `${pair.foreground} on ${pair.background} (${pair.role}) is ${ratio.toFixed(2)}:1`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it('uses ink, not ivory, as the text colour on coral', () => {
    const inkOnCoral = contrastRatio(PALETTE.ink, PALETTE.coral);
    const ivoryOnCoral = contrastRatio(PALETTE.ivory, PALETTE.coral);
    expect(inkOnCoral).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(ivoryOnCoral).toBeLessThan(WCAG_AA_TEXT);
  });

  it('uses ink, not ivory, as the CTA focus ring on coral', () => {
    expect(paletteContrast('ink', 'coral')).toBeGreaterThanOrEqual(WCAG_AA_UI);
    expect(paletteContrast('ivory', 'coral')).toBeLessThan(WCAG_AA_UI);
    expect(isApprovedPair('ink', 'coral', 'ui')).toBe(true);
    expect(THEME_CSS).toContain('--color-ring-cta:');
    expect(THEME_CSS).toContain('[data-cta]:focus-visible');
  });

  it('keeps botanical as a fill on aubergine, not as text', () => {
    expect(paletteContrast('botanical', 'aubergine')).toBeLessThan(WCAG_AA_TEXT);
    expect(paletteContrast('ivory', 'botanical')).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    expect(paletteContrast('ivory', 'aubergine')).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it('locks the approved typefaces', () => {
    expect(TYPEFACES.sans).toBe('Manrope');
    expect(TYPEFACES.serif).toBe('DM Serif Display');
    expect(THEME_CSS).toContain("'Manrope Variable'");
    expect(THEME_CSS).toContain("'DM Serif Display'");
  });

  it('keeps default body text well above AA on ivory', () => {
    expect(paletteContrast('ink', 'ivory')).toBeGreaterThan(10);
    expect(paletteContrast('botanical', 'ivory')).toBeGreaterThan(7);
    expect(paletteContrast('aubergine', 'ivory')).toBeGreaterThan(7);
    expect(paletteContrast('ivory', 'botanical')).toBeGreaterThan(7);
  });
});
