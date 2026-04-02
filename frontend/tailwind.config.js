/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          glow: 'rgba(139, 92, 246, 0.4)',
        },
        secondary: {
          DEFAULT: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.4)',
        },
        background: '#09090b',
        card: {
          DEFAULT: 'rgba(24, 24, 27, 0.8)',
          border: 'rgba(39, 39, 42, 0.5)',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'pulsate': 'pulsate 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulsate: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
