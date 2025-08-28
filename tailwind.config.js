import fs from 'fs';
import path from 'path';

// Read theme configuration
const themeConfig = JSON.parse(fs.readFileSync(path.resolve('./theme.json'), 'utf8'));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: themeConfig.colors.background,
        text: themeConfig.colors.text,
        accent: themeConfig.colors.accent,
      },
      fontFamily: {
        primary: [themeConfig.typography.fontFamily.primary],
      },
      fontSize: {
        'base': `${themeConfig.typography.fontSize.base}px`,
        'h6': `${themeConfig.typography.fontSize.h6}px`,
        'h5': `${themeConfig.typography.fontSize.h5}px`,
        'h4': `${themeConfig.typography.fontSize.h4}px`,
        'h3': `${themeConfig.typography.fontSize.h3}px`,
        'h2': `${themeConfig.typography.fontSize.h2}px`,
        'h1': `${themeConfig.typography.fontSize.h1}px`,
      },
      fontWeight: {
        normal: themeConfig.typography.fontWeight.normal,
        medium: themeConfig.typography.fontWeight.medium,
        semibold: themeConfig.typography.fontWeight.semibold,
        bold: themeConfig.typography.fontWeight.bold,
      },
      spacing: {
        'xs': `${themeConfig.spacing.xs}px`,
        'sm': `${themeConfig.spacing.sm}px`,
        'md': `${themeConfig.spacing.md}px`,
        'lg': `${themeConfig.spacing.lg}px`,
        'xl': `${themeConfig.spacing.xl}px`,
        'xxl': `${themeConfig.spacing.xxl}px`,
      }
    },
  },
  plugins: [],
}