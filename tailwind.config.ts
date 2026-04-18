import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#06110d",
          900: "#0b1912",
          800: "#10261b",
          700: "#143224",
          600: "#1f5a3d",
          500: "#2e7b52",
          400: "#47a06d"
        },
        ink: "#ebf4ef",
        surface: "#0d1117",
        accent: "#d9ff66",
        coral: "#ff6b57",
        cyan: "#62d2ff"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(217,255,102,0.18), 0 20px 50px rgba(0,0,0,0.32)"
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
