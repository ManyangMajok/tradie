const { colors, typography, spacing, radii } = require('../../packages/ui/src/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: colors.background,
        surface: colors.surface,
        'surface-container': colors.surfaceContainer,
        primary: colors.primary,
        'primary-light': colors.primaryLight,
        secondary: colors.secondary,
        tertiary: colors.tertiary,
        error: colors.error,
        'on-surface': colors.onSurface,
        'on-surface-variant': colors.onSurfaceVariant,
        outline: colors.outline,
      },
      fontFamily: {
        sans: [typography.fonts.regular],
        semibold: [typography.fonts.semiBold],
        bold: [typography.fonts.bold],
      },
      borderRadius: {
        sm: `${radii.sm}px`,
        md: `${radii.md}px`,
        lg: `${radii.lg}px`,
        xl: `${radii.xl}px`,
        '2xl': `${radii.xxl}px`,
        full: `${radii.full}px`,
      },
    },
  },
  plugins: [],
};
