/**
 * Canonical hex colours for the system. Spec §3 brand colours plus Bob-approved homepage
 * tokens (gold stars, WhatsApp third-party brand). Do not add a hex anywhere else.
 *
 * Warm beige and powder pink fail WCAG AA as body text on ivory; they are surfaces and
 * decorative accents, never text-on-ivory. Gold is a star glyph on ivory (decorative).
 * WhatsApp green is Meta’s functional brand fill for the FAB, not a Kairos colour.
 * See `contrast.ts`.
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
  /** Star fill sampled from the approved homepage frames (Bob, 2026-09-14). */
  gold: '#C88B43',
  /** WhatsApp brand green — third-party functional, not Kairos. */
  whatsapp: '#25D366',
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
  gold: 'gold',
  whatsapp: 'whatsapp',
};

export const PALETTE_HEXES: readonly PaletteHex[] = Object.values(PALETTE);

/** Spec §3. Bob approved Manrope (interface) and DM Serif Display (headings). */
export const TYPEFACES = {
  sans: 'Manrope',
  sansVariable: 'Manrope Variable',
  serif: 'DM Serif Display',
} as const;
