import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canopy: "#173f2a",
        moss: "#476a34",
        seed: "#f6d47b",
        skywash: "#e8f4f8"
      }
    }
  },
  plugins: []
};

export default config;
