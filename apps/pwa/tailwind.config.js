/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        system: {
          bg: "#040814",
          card: "rgba(7, 17, 38, 0.88)",
          border: "#dfa86c",
          borderDim: "rgba(223, 168, 108, 0.3)",
          cyan: "#00f0ff",
          blue: "#3b82f6",
          dark: "#02040a",
        },
        fantasy: {
          bg: "#040814",
          deep: "#02040a",
          card: "rgba(7, 17, 38, 0.88)",
          surface: "rgba(10, 22, 48, 0.78)",
          border: "#dfa86c",
          borderDim: "rgba(223, 168, 108, 0.35)",
          borderMuted: "rgba(223, 168, 108, 0.16)",
          gold: {
            bright: "#fef08a",
            highlight: "#fde047",
            DEFAULT: "#dfa86c",
            amber: "#f3ba63",
            bronze: "#c8923a",
            dark: "#966422",
            shadow: "rgba(223, 168, 108, 0.28)",
          },
        },
      },
      fontFamily: {
        fantasy: ["Cinzel", "Trajan Pro", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        "system-glow": "0 0 22px rgba(223, 168, 108, 0.35)",
        "system-glow-subtle": "0 0 12px rgba(223, 168, 108, 0.2)",
        "fantasy-glow": "0 0 25px rgba(223, 168, 108, 0.35)",
        "fantasy-glow-lg": "0 0 45px rgba(223, 168, 108, 0.5)",
        "fantasy-subtle": "0 0 15px rgba(223, 168, 108, 0.15)",
        "fantasy-inner": "inset 0 0 15px rgba(223, 168, 108, 0.1)",
      },
    },
  },
  plugins: [],
};
