import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B2635",
          dark: "#6c1d29",
          light: "#a63b4c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
