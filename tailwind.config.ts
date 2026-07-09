import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"]
      },
      colors: {
        // Crafted cool-neutral scale (not default slate) for surfaces + text.
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#dcdfe7",
          300: "#c1c6d2",
          400: "#9aa1b3",
          500: "#727a90",
          600: "#565d72",
          700: "#434860",
          800: "#282c3d",
          900: "#181b28",
          950: "#0c0e16"
        },
        // Single confident accent: iris.
        iris: {
          50: "#eef0ff",
          100: "#e2e5ff",
          200: "#cacdff",
          300: "#a9adff",
          400: "#8781fb",
          500: "#6c5ef5",
          600: "#5a45e8",
          700: "#4c37cc",
          800: "#3f30a4",
          900: "#362d82"
        },
        // Kept for any lingering references; mirrors iris.
        brand: {
          50: "#eef0ff",
          100: "#e2e5ff",
          200: "#cacdff",
          300: "#a9adff",
          400: "#8781fb",
          500: "#6c5ef5",
          600: "#5a45e8",
          700: "#4c37cc",
          800: "#3f30a4",
          900: "#362d82"
        }
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(12, 14, 22, 0.04), 0 1px 3px 0 rgba(12, 14, 22, 0.06)",
        "card-hover":
          "0 4px 12px -2px rgba(12, 14, 22, 0.08), 0 2px 6px -2px rgba(12, 14, 22, 0.06)",
        pop: "0 10px 30px -10px rgba(12, 14, 22, 0.25)",
        glow: "0 0 0 1px rgba(108, 94, 245, 0.35), 0 8px 24px -8px rgba(108, 94, 245, 0.45)"
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "grid-light":
          "linear-gradient(to right, rgba(12,14,22,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,14,22,0.045) 1px, transparent 1px)"
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.85)", opacity: "0.6" },
          "70%": { transform: "scale(1.7)", opacity: "0" },
          "100%": { transform: "scale(1.7)", opacity: "0" }
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        },
        caret: {
          "0%,49%": { opacity: "1" },
          "50%,100%": { opacity: "0" }
        },
        toastIn: {
          "0%": { transform: "translateY(12px) scale(0.98)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" }
        },
        gatePop: {
          "0%": { transform: "scale(0.85)", opacity: "0.4" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        railTravel: {
          "0%": { left: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { left: "100%", opacity: "0" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        slideUp: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        fadeIn: "fadeIn 0.4s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        caret: "caret 1.1s step-end infinite",
        toastIn: "toastIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
        gatePop: "gatePop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        railTravel: "railTravel 3.4s cubic-bezier(0.65, 0, 0.35, 1) infinite"
      }
    }
  },
  plugins: []
};

export default config;
