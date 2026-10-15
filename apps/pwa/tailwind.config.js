/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        system: {
          bg: "#050811",
          card: "rgba(10, 18, 36, 0.75)",
          border: "#0ea5e9",
          borderDim: "rgba(14, 165, 233, 0.25)",
          cyan: "#00f0ff",
          blue: "#3b82f6",
          dark: "#030712",
        },
      },
      boxShadow: {
        "system-glow": "0 0 20px rgba(0, 240, 255, 0.35)",
        "system-glow-subtle": "0 0 10px rgba(14, 165, 233, 0.2)",
      },
    },
  },
  plugins: [],
};
