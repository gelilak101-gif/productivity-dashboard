/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        ink: {
          50: '#f7f6f3',
          100: '#ede9e0',
          200: '#d8d0c0',
          300: '#bfb298',
          400: '#a3916e',
          500: '#8b7355',
          600: '#6e5a40',
          700: '#52422e',
          800: '#382d1e',
          900: '#1e1710',
          950: '#0f0c07',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        sage: {
          50: '#f2f4f0',
          100: '#e0e6db',
          200: '#c2ccb8',
          300: '#9bac8e',
          400: '#748c66',
          500: '#566d49',
          600: '#425438',
          700: '#303d28',
          800: '#1f2919',
          900: '#10140d',
        },
        rust: {
          400: '#e07a5f',
          500: '#c9614a',
          600: '#a84a36',
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
