import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        // Flat cards: a hairline border instead of a drop shadow
        boxShadow: {
          small: "0 0 0 1px hsl(var(--heroui-default-200))",
          medium: "0 0 0 1px hsl(var(--heroui-default-200))",
          large: "0 8px 24px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px hsl(var(--heroui-default-200))",
        },
        radius: { large: "0.875rem" },
      },
    }),
  ],
}

module.exports = config;