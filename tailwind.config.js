/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - Tesla/Apple inspired black
        primary: {
          DEFAULT: '#000000',
          hover: '#1f2937',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Secondary accent - Indigo
        secondary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Surface colors
        surface: {
          DEFAULT: '#f9fafb',
          hover: '#f3f4f6',
          white: '#ffffff',
        },
        // Border colors
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#d1d5db',
        },
        // Status colors
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#dc2626',
        },
        // Trust score colors (MC Exchange specific)
        trust: {
          high: '#10b981',
          medium: '#f59e0b',
          low: '#ef4444',
        },
        // Text colors
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
        },
        // Domilea light-theme tokens (added for the AI-intelligence repositioning).
        // Use these via class names like `bg-domilea-soft`, `text-domilea-ink`,
        // `border-domilea-line`, `text-domilea-blue`. Existing palette above is untouched.
        domilea: {
          bg: '#FFFFFF',
          soft: '#F7F9FC',
          card: '#FFFFFF',
          ink: '#0B1220',
          muted: '#5B6472',
          line: '#E5EAF0',
          // MorPro-aligned blue ramp (deep → bright → cyan).
          // Use `domilea-blue` for primary CTAs/accents, `domilea-blue-bright` for highlights, `domilea-cyan` for gradient endcaps.
          blue: '#0066FF',
          'blue-bright': '#34CCFF',
          cyan: '#00D4FF',
          'blue-soft': '#E6F0FF',
          navy: '#07111F',
          good: '#16A34A',
          warn: '#F59E0B',
          risk: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
