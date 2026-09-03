/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F1420",
        surface: "#161C2C",
        surface2: "#1B2233",
        border: "#262F45",
        gold: "#D4A64A",
        teal: "#3EC6B0",
        danger: "#E15A5A",
        muted: "#8892A6",
      },
    },
  },
  plugins: [],
};
