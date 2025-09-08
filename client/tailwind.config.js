/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // For landing page / marketing sections
        'heading': ['Poppins', 'Montserrat', 'sans-serif'],
        'body': ['Inter', 'Roboto', 'sans-serif'],
        // For dashboard / admin panel
        'dashboard': ['Inter', 'Source Sans Pro', 'sans-serif'],
        // For authentication pages
        'auth': ['Roboto', 'Inter', 'sans-serif'],
        // Individual font families if needed
        'poppins': ['Poppins', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'source-sans': ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
}