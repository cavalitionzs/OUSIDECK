import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: "#15171C",
          raised: "#1B1E24",
        },
        key: {
          DEFAULT: "#22252C",
          hover: "#2A2E37",
          active: "#2E323C",
          border: "#33373F",
        },
        ink: {
          DEFAULT: "#ECEDEF",
          muted: "#8B909C",
          faint: "#5B606B",
        },
        live: "#E4572E",
        good: "#4FD1A5",
      },
      fontFamily: {
        mono: ["var(--font-key)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        key: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)",
        keyActive: "inset 0 2px 4px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
