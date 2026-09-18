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
        /* 미래AI랩 브랜드 컬러 (로고에서 추출) */
        brand: {
          50: "#EAF7FB",
          100: "#CFEAF4",
          300: "#4FC6EA",
          400: "#00A9E2",
          500: "#0084FC",
          600: "#00606C",
          700: "#00546C",
          800: "#003C48",
          900: "#00303C",
          cyan: "#00E4FC",
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
        /* CTA 버튼 위를 아주 약하게 스치는 광택.
           한 번 지나간 뒤 대부분의 시간은 화면 밖에서 멈춰 있어
           "은은하게 한 번씩" 반짝이는 정도로만 보인다. */
        "cta-sweep": {
          "0%": { transform: "translateX(-150%) skewX(-18deg)", opacity: "0" },
          "4%": { opacity: "0.5" },
          "16%": { transform: "translateX(150%) skewX(-18deg)", opacity: "0" },
          "100%": { transform: "translateX(150%) skewX(-18deg)", opacity: "0" },
        },
        /* 배지 테두리 광택 — 밝기만 아주 조금 오르내린다 */
        "badge-glow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out both",
        "fade-in": "fade-in 0.25s ease-out both",
        "pop-in": "pop-in 0.25s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "heart-pop": "heart-pop 0.35s ease-out",
        "toast-in": "toast-in 0.25s ease-out both",
        "cta-sweep": "cta-sweep 6s ease-in-out infinite",
        "badge-glow": "badge-glow 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
