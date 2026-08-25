import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF8F2",
          100: "#F7F2E8",
          200: "#F0E8D9",
          300: "#E6DBC7",
          400: "#D8C9AF",
        },
        coffee: {
          50: "#F5EFE7",
          100: "#E9DFD1",
          200: "#CDBBA4",
          300: "#A98F73",
          400: "#8A6F52",
          500: "#6F563E",
          600: "#5A4530",
          700: "#463525",
          800: "#38291C",
          900: "#2C2015",
        },
        forest: {
          50: "#F0F4EC",
          100: "#DFE8D6",
          200: "#C2D4B0",
          300: "#9DB884",
          400: "#7C9C61",
          500: "#5F7F47",
          600: "#4A6538",
          700: "#3A502C",
          800: "#2D3F23",
        },
        teal: {
          500: "#3E7C74",
          600: "#33665F",
        },
        amber2: {
          400: "#D9A441",
          500: "#C4902F",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "'Noto Sans KR'",
          "'Segoe UI'",
          "'Apple SD Gothic Neo'",
          "sans-serif",
        ],
        display: [
          "'Nanum Myeongjo'",
          "'Noto Serif KR'",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(60, 45, 30, 0.05), 0 4px 16px rgba(60, 45, 30, 0.07)",
        "card-lg": "0 2px 6px rgba(60, 45, 30, 0.08), 0 12px 32px rgba(60, 45, 30, 0.14)",
        marker: "0 2px 4px rgba(44, 32, 21, 0.28)",
        sheet: "0 -8px 32px rgba(60, 45, 30, 0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "70%": { transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(2.1)", opacity: "0" },
        },
        "heart-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out both",
        "fade-in": "fade-in 0.25s ease-out both",
        "pop-in": "pop-in 0.25s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "heart-pop": "heart-pop 0.35s ease-out",
        "toast-in": "toast-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
