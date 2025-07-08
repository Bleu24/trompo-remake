/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // This enables class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom colors for light and dark themes
        primary: {
          light: '#3B82F6', // blue-500
          dark: '#F97316', // orange-500
        },
      },
    },
  },
  plugins: [],
}
