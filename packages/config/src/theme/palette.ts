/**
 * Kairos brand palette — the only hex colours in the system.
 *
 * Spec §3. Warm beige and powder pink fail WCAG AA as body text on ivory; they are
 * surfaces and decorative accents, never text-on-ivory. See `contrast.ts`.
 *
 * Do not add a hex here that is not in the spec. Do not add a hex anywhere else.
 */

export const PALETTE = {
  ivory: '#F8F5EF',
  beige: '#D8C5AD',
  botanical: '#173F32',
  softGreen: '#DCE4D1',
  powderPink: '#E7B5A6',
  coral: '#E86F5B',
  aubergine: '#3C2635',
  ink: '#18211D',
} as const;

export type PaletteName = keyof typeof PALETTE;
export type PaletteHex = (typeof PALETTE)[PaletteName];

/** CSS custom-property names matching `@theme` in `packages/config/theme/kairos.css`. */
export const PALETTE_CSS_NAMES: Record<PaletteName, string> = {
  ivory: 'ivory',
  beige: 'beige',
  botanical: 'botanical',
  softGreen: 'soft-green',
  powderPink: 'powder-pink',
  coral: 'coral',
  aubergine: 'aubergine',
  ink: 'ink',
};

export const PALETTE_HEXES: readonly PaletteHex[] = Object.values(PALETTE);

/** Spec §3. Bob approved Manrope (interface) and DM Serif Display (headings). */
export const TYPEFACES = {
  sans: 'Manrope',
  sansVariable: 'Manrope Variable',
  serif: 'DM Serif Display',
} as const;
