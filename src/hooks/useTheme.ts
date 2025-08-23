import { useEffect } from 'react'
import themeConfig from '../../theme.json'

export interface Theme {
  colors: {
    background: string
    text: string
    accent: string
  }
  typography: {
    fontFamily: {
      primary: string
    }
    fontSize: {
      base: number
      h6: number
      h5: number
      h4: number
      h3: number
      h2: number
      h1: number
    }
    fontWeight: {
      normal: number
      medium: number
      semibold: number
      bold: number
    }
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
}

export const useTheme = (): Theme => {
  const theme = themeConfig as Theme

  useEffect(() => {
    // Apply CSS custom properties to the root element
    const root = document.documentElement

    // Colors
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--color-accent', theme.colors.accent)

    // Typography
    root.style.setProperty('--font-family-primary', theme.typography.fontFamily.primary)
    
    // Font sizes
    root.style.setProperty('--font-size-base', `${theme.typography.fontSize.base}px`)
    root.style.setProperty('--font-size-h6', `${theme.typography.fontSize.h6}px`)
    root.style.setProperty('--font-size-h5', `${theme.typography.fontSize.h5}px`)
    root.style.setProperty('--font-size-h4', `${theme.typography.fontSize.h4}px`)
    root.style.setProperty('--font-size-h3', `${theme.typography.fontSize.h3}px`)
    root.style.setProperty('--font-size-h2', `${theme.typography.fontSize.h2}px`)
    root.style.setProperty('--font-size-h1', `${theme.typography.fontSize.h1}px`)

    // Font weights
    root.style.setProperty('--font-weight-normal', theme.typography.fontWeight.normal.toString())
    root.style.setProperty('--font-weight-medium', theme.typography.fontWeight.medium.toString())
    root.style.setProperty('--font-weight-semibold', theme.typography.fontWeight.semibold.toString())
    root.style.setProperty('--font-weight-bold', theme.typography.fontWeight.bold.toString())

    // Spacing
    root.style.setProperty('--spacing-xs', `${theme.spacing.xs}px`)
    root.style.setProperty('--spacing-sm', `${theme.spacing.sm}px`)
    root.style.setProperty('--spacing-md', `${theme.spacing.md}px`)
    root.style.setProperty('--spacing-lg', `${theme.spacing.lg}px`)
    root.style.setProperty('--spacing-xl', `${theme.spacing.xl}px`)
    root.style.setProperty('--spacing-xxl', `${theme.spacing.xxl}px`)
  }, [theme])

  return theme
}