import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        foreground: "#F8F8F6",
        surface: "#111111",
        border: "rgba(248, 248, 246, 0.16)",
        muted: "#888888",
        line: "rgba(248, 248, 246, 0.08)",
        accent: "#C9A84C",
        warm: "#F8F8F6"
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ['"EB Garamond"', "serif"]
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
