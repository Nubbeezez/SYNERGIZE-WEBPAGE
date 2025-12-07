import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Dembrandt Design System Colors
      colors: {
        // Primary backgrounds
        primary: '#0c0e12',
        'primary-light': '#141820',
        'nav-hover': '#090f20',

        // Base colors
        black: '#000000',
        white: '#ffffff',

        // Accent colors
        'accent-pink': '#f70094',
        'accent-cyan': '#00ffff',
        'accent-green': '#00f7a5',
        'accent-yellow': '#fce477',
        highlight: '#defe48',

        // Muted/neutral
        muted: '#898989',
        'muted-light': '#a0a0a0',

        // Ring/focus
        ring: 'rgba(59, 130, 246, 0.5)',

        // Status colors
        success: '#00f7a5',
        error: '#ff4757',
        warning: '#fce477',
        info: '#00ffff',
      },

      // Typography
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        heading: ['DM Sans', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
        'tiny': ['0.75rem', { lineHeight: '1.4' }],
      },

      // Spacing (4px base)
      spacing: {
        '0': '0',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },

      // Border radius
      borderRadius: {
        'none': '0',
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },

      // Shadows with neon effects
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'lg': '0 10px 25px rgba(0, 0, 0, 0.5)',
        'xl': '0 20px 40px rgba(0, 0, 0, 0.5)',

        // Neon glow effects
        'neon-pink': '0 0 20px rgba(247, 0, 148, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-green': '0 0 20px rgba(0, 247, 165, 0.5)',
        'neon-yellow': '0 0 20px rgba(222, 254, 72, 0.5)',

        // Card shadows
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
      },

      // Transitions
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },

      // Animations
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },

      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(247, 0, 148, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(247, 0, 148, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },

      // Background gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(180deg, #0c0e12 0%, #000000 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(20, 24, 32, 0.8) 0%, rgba(12, 14, 18, 0.9) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f70094 0%, #00ffff 100%)',
      },
    },
  },
  plugins: [],
}

export default config
