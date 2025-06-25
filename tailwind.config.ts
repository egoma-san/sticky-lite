import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        crumple: 'crumple 0.3s ease-in forwards',
      },
      keyframes: {
        crumple: {
          '0%': { 
            transform: 'scale(1) rotate(0deg)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(0.8) rotate(180deg)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scale(0) rotate(360deg)',
            opacity: '0'
          },
        }
      }
    },
  },
  plugins: [],
};
export default config;