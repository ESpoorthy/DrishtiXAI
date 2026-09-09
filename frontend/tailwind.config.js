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
        /*
         * PRIMARY: deep teal — clinical, calm, trustworthy
         * Replaces the old blue-heavy brand palette.
         */
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        /*
         * SECONDARY: muted emerald / green — positive results, success states
         */
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        /*
         * Surface / background tokens
         */
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f8f9fa',        // warm off-white
          subtle:  '#f1f5f4',        // very light teal-tinted
          border:  '#e5e8e7',        // neutral border
          dark:    '#1a2e2b',        // sidebar background
        },
        /*
         * Semantic colour shortcuts used in components
         * (maps to teal for primary interactions)
         */
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        /*
         * Sidebar tokens
         */
        sidebar: {
          bg:          '#1a2e2b',    // deep dark teal
          hover:       '#243b37',
          active:      '#0f766e',
          text:        '#94b5b0',
          active_text: '#ffffff',
        },
        /*
         * Warning / amber — for demo banners, mild findings
         */
        amber: {
          50:  '#fffbeb',
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
        /*
         * Charcoal text system
         */
        ink: {
          DEFAULT: '#1c2b29',    // primary text
          muted:   '#4b6660',    // secondary text
          subtle:  '#7a9995',    // tertiary / placeholder
        },
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0/.06), 0 1px 2px -1px rgb(0 0 0/.06)',
        'card-hover': '0 4px 16px -2px rgb(0 0 0/.09), 0 2px 6px -1px rgb(0 0 0/.05)',
        pill:       '0 1px 4px 0 rgb(0 0 0/.10)',
        glow:       '0 0 0 3px rgba(13,148,136,.20)',
        'btn-primary': '0 2px 8px -1px rgba(13,148,136,.40)',
        inner:      'inset 0 1px 3px 0 rgb(0 0 0/.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        /* Main gradient — deep teal, not blue */
        'gradient-brand': 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
        /* Hero / dark sections */
        'gradient-hero':  'linear-gradient(135deg, #1a2e2b 0%, #0f4a44 50%, #0d9488 100%)',
        /* Light card accent */
        'gradient-card':  'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
        /* Subtle surface */
        'gradient-surface': 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
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
