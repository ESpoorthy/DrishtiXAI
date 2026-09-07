/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* Brand — deep teal-blue */
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        /* Sidebar */
        sidebar: {
          bg:     '#0f172a',
          hover:  '#1e293b',
          active: '#1d4ed8',
          text:   '#94a3b8',
          active_text: '#ffffff',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f8fafc',
          border:  '#e2e8f0',
        },
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0/.07), 0 1px 2px -1px rgb(0 0 0/.07)',
        'card-hover': '0 4px 16px -2px rgb(0 0 0/.10), 0 2px 6px -1px rgb(0 0 0/.06)',
        pill:  '0 1px 4px 0 rgb(0 0 0/.10)',
        glow:  '0 0 0 3px rgba(59,130,246,.25)',
        'btn-primary': '0 2px 8px -1px rgba(37,99,235,.45)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
        'gradient-hero':  'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
        'gradient-card':  'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      },
      animation: {
        'fade-up':      'fadeUp .4s ease both',
        'fade-in':      'fadeIn .3s ease both',
        'slide-in':     'slideIn .35s cubic-bezier(.16,1,.3,1) both',
        'pulse-soft':   'pulseSoft 2s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
        'progress-bar': 'progressBar 1s ease both',
      },
      keyframes: {
        fadeUp:      { from: { opacity:'0', transform:'translateY(14px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:      { from: { opacity:'0' }, to: { opacity:'1' } },
        slideIn:     { from: { opacity:'0', transform:'translateX(-16px)' }, to: { opacity:'1', transform:'translateX(0)' } },
        pulseSoft:   { '0%,100%': { opacity:'1' }, '50%': { opacity:'.6' } },
        progressBar: { from: { width:'0%' } },
      },
    },
  },
  plugins: [],
}
