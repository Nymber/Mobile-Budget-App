/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#3b82f6'
        },
        surface: '#ffffff',
        background: '#f8fafc',
        error: '#ef4444',
        success: '#22c55e'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
};