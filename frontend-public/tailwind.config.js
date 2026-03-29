/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#32373c',
        'primary-hover': '#1e2226',
      },
    },
  },
  plugins: [],
}

