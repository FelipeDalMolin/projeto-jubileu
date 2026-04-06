/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        input: "hsl(214 32% 91%)",
        ring: "hsl(217 91% 60%)",
        background: "hsl(216 33% 97%)",
        foreground: "hsl(222 47% 11%)",
        primary: {
          DEFAULT: "hsl(212 100% 50%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(215 25% 27%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(214 32% 91%)",
          foreground: "hsl(215 16% 47%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222 47% 11%)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        panel: "0 6px 24px -12px rgb(15 23 42 / 0.35)",
      },
    },
  },
  plugins: [],
};
