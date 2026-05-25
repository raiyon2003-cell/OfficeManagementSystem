/**
 * CONTEG brand guidelines — official palette & typography
 * @see Brand Guideline PDF
 */
export const BRAND_COLORS = {
  lightLimeGreen: "#588157",
  mutedOliveGreen: "#819171",
  charcoalGreen: "#344e41",
  deepTealBlue: "#073b4c",
  steelTeal: "#28666e",
} as const;

export const BRAND_FONTS = {
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
