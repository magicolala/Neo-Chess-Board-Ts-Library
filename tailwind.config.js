import defaultTheme from 'tailwindcss/defaultTheme'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './demo/**/*.{html,js,jsx,ts,tsx}',
    './examples/**/*.{html,js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          base: 'var(--color-bg-canvas)'
        },
        surface: {
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
          3: 'var(--color-surface-3)',
          4: 'var(--color-surface-4)'
        },
        ink: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverted: 'var(--color-text-inverted)'
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)'
        },
        human: {
          1: 'var(--color-human-1)',
          2: 'var(--color-human-2)',
          3: 'var(--color-human-3)',
          4: 'var(--color-human-4)',
          5: 'var(--color-human-5)'
        },
        engine: {
          1: 'var(--color-engine-1)',
          2: 'var(--color-engine-2)',
          3: 'var(--color-engine-3)',
          4: 'var(--color-engine-4)',
          5: 'var(--color-engine-5)'
        },
        glass: {
          DEFAULT: 'var(--color-glass-bg)',
          hover: 'var(--color-glass-hover)',
          border: 'var(--color-glass-border)',
          highlight: 'var(--color-glass-highlight)',
          focus: 'var(--color-glass-focus)',
          accent: 'var(--color-glass-accent)'
        },
        accent: {
          primary: 'var(--color-accent-primary)',
          secondary: 'var(--color-accent-secondary)'
        }
      },
      backgroundImage: {
        'repeating-diagonal': 'var(--bg-repeating-diagonal)',
        'glass-glint': 'var(--bg-glass-glint)',
        'hero-orbit': 'var(--bg-hero-orbit)'
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        focus: 'var(--shadow-focus)'
      },
      borderRadius: {
        glass: 'var(--radius-glass)',
        xl: 'var(--radius-xl)'
      },
      spacing: {
        '3xs': 'var(--space-3xs)',
        '2xs': 'var(--space-2xs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4xl': 'var(--space-4xl)'
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono]
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.ink.primary'),
            a: {
              color: theme('colors.accent.primary'),
              textDecoration: 'none',
              '&:hover': {
                color: theme('colors.accent.secondary'),
                textDecoration: 'underline'
              }
            },
            code: {
              color: theme('colors.engine.5'),
              backgroundColor: theme('colors.surface.2'),
              padding: '0.125rem 0.375rem',
              borderRadius: '0.375rem',
              fontWeight: '500'
            },
            blockquote: {
              borderLeftColor: theme('colors.human.4'),
              backgroundColor: theme('colors.surface.2'),
              color: theme('colors.ink.secondary')
            },
            'h1, h2, h3, h4': {
              color: theme('colors.ink.primary')
            }
          }
        },
        invert: {
          css: {
            color: theme('colors.ink.inverted'),
            a: {
              color: theme('colors.human.3'),
              '&:hover': {
                color: theme('colors.human.4')
              }
            },
            code: {
              color: theme('colors.engine.2'),
              backgroundColor: theme('colors.surface.3')
            },
            blockquote: {
              borderLeftColor: theme('colors.engine.4'),
              backgroundColor: theme('colors.surface.3'),
              color: theme('colors.ink.muted')
            },
            'h1, h2, h3, h4': {
              color: theme('colors.ink.inverted')
            }
          }
        }
      })
    }
  },
  plugins: [typography]
}
