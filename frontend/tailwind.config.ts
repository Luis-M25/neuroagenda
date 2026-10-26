import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBFAFD',
          100: '#D1F2F9',
          200: '#A3E5F3',
          300: '#6DD4E9',
          400: '#4CCADF',
          500: '#38C6DE',
          600: '#29AEC7',
          700: '#2191A8',
          800: '#1D7589',
          900: '#1A5F6F',
        },
        neutral: {
          50: '#F7F7F6',
          100: '#EBEBEA',
          200: '#D4D4D2',
          300: '#B8B8B5',
          400: '#9B9B98',
          500: '#7E7E7B',
          600: '#686866',
          700: '#575756',
          800: '#454544',
          900: '#363635',
        },
        success: { 50: '#ECFDF5', 100: '#D1FAE5', 500: '#10b981', 600: '#059669' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#f59e0b', 600: '#d97706' },
        danger: { 50: '#FEF2F2', 100: '#FEE2E2', 500: '#ef4444', 600: '#dc2626' },
        surface: {
          DEFAULT: '#FAFAF9',
          50: '#FFFFFF',
          100: '#F9F9F8',
          200: '#F3F3F2',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.03)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.03)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'slide-in-up': 'slide-in-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
};

export default config;
