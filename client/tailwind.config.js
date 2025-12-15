export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e6eaff',
          200: '#cfd7ff',
          300: '#a9b9ff',
          400: '#7e94ff',
          500: '#4f6dff',
          600: '#3b57e6',
          700: '#2f46bf',
          800: '#273a99',
          900: '#1f2f7a'
        },
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#f59e0b'
      }
    }
  },
  plugins: []
};
