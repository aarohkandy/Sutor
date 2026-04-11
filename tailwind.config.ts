import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F8F6",
        foreground: "#0A0A0A",
        surface: "#FFFFFF",
        border: "#CCCCCC",
        muted: "#888888",
        line: "#E5E5E5",
        accent: "#C9A84C",
        warm: "#F7F3E9"
      },
      fontFamily: {
        body: [
          "var(--font-inter)"
        ],
        display: [
          "var(--font-eb-garamond)"
        ]
      },
      letterSpacing: {
        caps: "0.22em"
      },
      keyframes: {
        pulseQuiet: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.85" }
        },
        growLine: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" }
        }
      },
      animation: {
        pulseQuiet: "pulseQuiet 1.8s ease-in-out infinite",
        growLine: "growLine 1.6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
