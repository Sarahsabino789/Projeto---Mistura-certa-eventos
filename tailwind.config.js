/**
 * Tailwind CSS — configuração de build para produção.
 * Substitui o <script src="https://cdn.tailwindcss.com"> usado em desenvolvimento.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        surface: "#1A1A1A",
        gold: "#D4AF37",
        coral: "#FF6B35",
        mint: "#2A9D8F",
        mute: "#B0B0B0",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
