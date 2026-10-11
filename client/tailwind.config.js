/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF2F3',
          100: '#FCE7E8',
          200: '#F7C6C9',
          300: '#EE969C',
          400: '#DD5D66',
          500: '#C5303B',
          600: '#A41A25',
          700: '#790D16', // Primary Brand Burgundy
          800: '#640E15',
          900: '#541116',
          950: '#300508',
        },
        sand: {
          50: '#FAF8F3',
          100: '#F4EFE6',
          200: '#EAE1D0',
          300: '#E5D3AF', // Main Body Background
          400: '#D5BE93',
          500: '#C2A777',
          600: '#A98E60',
          700: '#8A714C',
          800: '#6F5C3E',
          900: '#5A4C34',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          cream: '#FAF7F0',
          elevated: '#FFFDF9',
          muted: '#F5EFE3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card': '0 2px 6px -1px rgba(121, 13, 22, 0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'elevated': '0 10px 25px -5px rgba(121, 13, 22, 0.08), 0 8px 10px -6px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};
