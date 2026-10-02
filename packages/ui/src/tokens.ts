// Premium Dark Glass design system — sourced from docs/stitch/premium_dark_glass/DESIGN.md

export const colors = {
  // Backgrounds
  background: '#171219',
  surface: '#231e25',
  surfaceContainer: '#39333b',
  surfaceContainerLow: '#29262B',

  // Primary (Electric Violet)
  primary: '#AC5FDB',
  primaryLight: '#e5b4ff',
  primaryContainer: '#bd6fec',
  primaryFixed: '#f5d9ff',

  // Secondary (Soft Lavender)
  secondary: '#f2affc',
  secondaryContainer: '#693376',
  secondaryAccent: '#E3A2EE',

  // Tertiary (Gold)
  tertiary: '#dac84e',
  tertiaryContainer: '#bdac35',

  // Status
  error: '#ffb4ab',
  errorContainer: '#93000a',

  success: '#86efac',
  warning: '#dac84e',
  onPrimary: '#171219',
  // Text
  onSurface: '#eadfea',
  onSurfaceVariant: '#d0c2d3',
  outline: '#998d9d',

  // Transparent helpers
  glassBackground: 'rgba(60, 53, 65, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.05)',
} as const;

export const typography = {
  fonts: {
    regular: 'Manrope_400Regular',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
  },
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    bodyLg: 16,
    bodyMd: 16,
    bodyXs: 12,
    h4: 18,
    bodySm: 14,
    labelCaps: 12,
  },
  weights: {
    regular: '400' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    h1: 38,
    h2: 31,
    h3: 28,
    bodyLg: 26,
    bodySm: 21,
    labelCaps: 12,
  },
  letterSpacings: {
    h1: -0.64,
    h2: -0.24,
    labelCaps: 0.96,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

// CTA gradient: use as LinearGradient colors prop
export const gradients = {
  primary: ['#AC5FDB', '#E3A2EE'] as [string, string],
  primaryContainer: ['#bd6fec', '#693376'] as [string, string],
} as const;
