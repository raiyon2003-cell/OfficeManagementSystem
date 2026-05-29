/**
 * CONTEG brand guidelines — official palette & typography
 * @see Brand Guideline PDF
 */
export const BRAND_COLORS = {
  /** Light Lime Green — primary actions, logo accent (Viridian family) */
  lightLimeGreen: "#588157",
  /** Muted Olive Green — secondary text, subtle UI */
  mutedOliveGreen: "#819171",
  /** Charcoal Green — headings, Night Forest dark-mode background */
  charcoalGreen: "#344e41",
  /** Deep Teal Blue — dark surfaces, auth gradient */
  deepTealBlue: "#073b4c",
  /** Steel Teal — accents, links, interactive highlights */
  steelTeal: "#28666e",
  /** Light mode page background (Platinum) */
  platinum: "#ebeee8",
  /** Dark mode page background (Night Forest) */
  nightForest: "#344e41",
} as const;

export const BRAND_FONTS = {
  /** Source Sans Pro — primary typeface (loaded as Source Sans 3 on Google Fonts) */
  primary: "Source Sans 3",
  weights: {
    regular: 400,
    semibold: 600,
  },
} as const;

export const CHART_COLORS = [
  BRAND_COLORS.lightLimeGreen,
  BRAND_COLORS.steelTeal,
  BRAND_COLORS.mutedOliveGreen,
  BRAND_COLORS.charcoalGreen,
  BRAND_COLORS.deepTealBlue,
] as const;

/** Calendar / status event colors mapped to brand palette */
export const BOOKING_STATUS_COLORS = {
  CONFIRMED: BRAND_COLORS.lightLimeGreen,
  PENDING: BRAND_COLORS.mutedOliveGreen,
  default: BRAND_COLORS.steelTeal,
} as const;
