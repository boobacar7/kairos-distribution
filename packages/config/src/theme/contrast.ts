/**
 * WCAG 2.2 contrast for the Kairos palette.
 *
 * Architecture §8.4: Warm beige and powder pink fail AA as body text on ivory and must
 * be marked decorative-only. This module is the approved pair matrix — agents must not
 * combine tokens freely.
 */

import { PALETTE, type PaletteName } from './palette.js';

export const WCAG_AA_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;
export const WCAG_AA_UI = 3;

export type ContrastRole = 'text' | 'large-text' | 'ui' | 'decorative';

export type ContrastPair = {
  readonly foreground: PaletteName;
  readonly background: PaletteName;
  readonly role: ContrastRole;
  readonly notes: string;
};

function srgbChannel(byte: number): number {
  const channel = byte / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): readonly [number, number, number] {
  const match = /^#([0-9A-Fa-f]{6})$/.exec(hex);
  if (!match?.[1]) {
    throw new Error(`Expected a six-digit hex colour, received ${hex}`);
  }
  const value = match[1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/** Relative luminance, WCAG 2.2. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lighter = Math.max(relativeLuminance(foregroundHex), relativeLuminance(backgroundHex));
  const darker = Math.min(relativeLuminance(foregroundHex), relativeLuminance(backgroundHex));
  return (lighter + 0.05) / (darker + 0.05);
}

export function paletteContrast(foreground: PaletteName, background: PaletteName): number {
  return contrastRatio(PALETTE[foreground], PALETTE[background]);
}

export function meetsWcagAa(ratio: number, role: Exclude<ContrastRole, 'decorative'>): boolean {
  if (role === 'text') return ratio >= WCAG_AA_TEXT;
  return ratio >= WCAG_AA_LARGE_TEXT;
}

/**
 * Approved foreground/background pairs. Anything not listed is forbidden for that role.
 *
 * Decorative pairs may be used as fills, rules and photography overlays, never as text
 * (including large text) or as a UI control boundary that must meet 3:1.
 */
export const APPROVED_PAIRS: readonly ContrastPair[] = [
  {
    foreground: 'ink',
    background: 'ivory',
    role: 'text',
    notes: 'Default body text on the page surface.',
  },
  {
    foreground: 'ink',
    background: 'beige',
    role: 'text',
    notes: 'Body text on warm beige surfaces (trust bar, chips).',
  },
  {
    foreground: 'ink',
    background: 'softGreen',
    role: 'text',
    notes: 'Body text on muted botanical surfaces.',
  },
  {
    foreground: 'ink',
    background: 'powderPink',
    role: 'text',
    notes: 'Body text on blush surfaces. Powder pink as a *foreground* on ivory is forbidden.',
  },
  {
    foreground: 'ink',
    background: 'coral',
    role: 'text',
    notes: 'The only accessible text colour on coral. Ivory-on-coral fails AA for body text.',
  },
  {
    foreground: 'ink',
    background: 'coral',
    role: 'ui',
    notes:
      'Hero / shop CTA focus ring. Ivory ring on coral fails 3:1; `data-cta` uses --color-ring-cta (ink).',
  },
  {
    foreground: 'botanical',
    background: 'ivory',
    role: 'text',
    notes: 'Brand text, links and secondary buttons on the page.',
  },
  {
    foreground: 'botanical',
    background: 'beige',
    role: 'text',
    notes: 'Brand text on warm beige.',
  },
  {
    foreground: 'botanical',
    background: 'softGreen',
    role: 'text',
    notes: 'Brand text on muted green.',
  },
  {
    foreground: 'aubergine',
    background: 'ivory',
    role: 'text',
    notes: 'Accent text, serif headings on the page.',
  },
  {
    foreground: 'aubergine',
    background: 'beige',
    role: 'text',
    notes: 'Accent text on warm beige.',
  },
  {
    foreground: 'aubergine',
    background: 'softGreen',
    role: 'text',
    notes: 'Accent text on muted green.',
  },
  {
    foreground: 'ivory',
    background: 'botanical',
    role: 'text',
    notes: 'Primary buttons, inverse hero and footer text.',
  },
  {
    foreground: 'ivory',
    background: 'aubergine',
    role: 'text',
    notes: 'Inverse-alt surfaces (admin sidebar, evening hero).',
  },
  {
    foreground: 'ivory',
    background: 'ink',
    role: 'text',
    notes: 'Highest-contrast inverse. Use sparingly — ink is a text colour first.',
  },
  {
    foreground: 'softGreen',
    background: 'botanical',
    role: 'large-text',
    notes: 'Muted label on botanical. Not for body copy.',
  },
  {
    foreground: 'beige',
    background: 'botanical',
    role: 'large-text',
    notes: 'Warm label on botanical. Not for body copy.',
  },
  {
    foreground: 'beige',
    background: 'aubergine',
    role: 'large-text',
    notes: 'Warm label on aubergine. Not for body copy.',
  },
  {
    foreground: 'powderPink',
    background: 'aubergine',
    role: 'large-text',
    notes: 'Blush accent on aubergine, large type only.',
  },
  {
    foreground: 'coral',
    background: 'aubergine',
    role: 'ui',
    notes: 'Promotional mark on aubergine. Not body text.',
  },
  {
    foreground: 'botanical',
    background: 'ivory',
    role: 'ui',
    notes: 'Focus ring and control borders on the page.',
  },
  {
    foreground: 'ivory',
    background: 'botanical',
    role: 'ui',
    notes: 'Focus ring on inverse surfaces.',
  },
  {
    foreground: 'beige',
    background: 'ivory',
    role: 'decorative',
    notes: 'FAILS AA as text on ivory (~1.5:1). Hairlines, photography mats, card edges only.',
  },
  {
    foreground: 'powderPink',
    background: 'ivory',
    role: 'decorative',
    notes: 'FAILS AA as text on ivory (~1.7:1). Blush washes and photography overlays only.',
  },
  {
    foreground: 'softGreen',
    background: 'ivory',
    role: 'decorative',
    notes: 'FAILS AA as text on ivory. Soft green is a surface, not a foreground.',
  },
  {
    foreground: 'coral',
    background: 'ivory',
    role: 'decorative',
    notes:
      'FAILS AA as text on ivory (~2.8:1, below even large-text 3:1). Do not use coral copy on ivory.',
  },
  {
    foreground: 'ivory',
    background: 'coral',
    role: 'decorative',
    notes: 'FAILS AA as body text (~2.8:1). Coral fills must use ink text, never ivory.',
  },
  {
    foreground: 'ivory',
    background: 'beige',
    role: 'decorative',
    notes: 'Insufficient contrast. Do not put ivory text on beige.',
  },
  {
    foreground: 'ivory',
    background: 'powderPink',
    role: 'decorative',
    notes: 'Insufficient contrast. Do not put ivory text on powder pink.',
  },
  {
    foreground: 'ivory',
    background: 'softGreen',
    role: 'decorative',
    notes: 'Insufficient contrast. Do not put ivory text on soft green.',
  },
  {
    foreground: 'gold',
    background: 'ivory',
    role: 'decorative',
    notes:
      'Star glyphs on the homepage (~2.7:1). Fails AA as text. Gold is not a copy colour on ivory.',
  },
  {
    foreground: 'ivory',
    background: 'whatsapp',
    role: 'decorative',
    notes:
      'WhatsApp FAB glyph. Official white-on-green brand fill fails 3:1; the control name is the accessible name.',
  },
  {
    foreground: 'ink',
    background: 'whatsapp',
    role: 'text',
    notes: 'Accessible text on the WhatsApp brand fill if copy is ever placed there.',
  },
  {
    foreground: 'ink',
    background: 'whatsapp',
    role: 'ui',
    notes: 'Focus/control contrast on the WhatsApp brand fill.',
  },
];

export function isApprovedPair(
  foreground: PaletteName,
  background: PaletteName,
  role: ContrastRole,
): boolean {
  return APPROVED_PAIRS.some(
    (pair) =>
      pair.foreground === foreground && pair.background === background && pair.role === role,
  );
}
