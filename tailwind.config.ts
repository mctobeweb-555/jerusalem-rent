import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marine — couleur de marque principale (remplace le bronze, jugé
        // trop "fade"/artisanal).
        primary: {
          50: "#f0f1f5",
          100: "#dfe0e9",
          200: "#bfc1d3",
          300: "#999cb8",
          400: "#6a6e93",
          500: "#3d4066",
          600: "#1c1f40", // marine
          700: "#16192f",
          800: "#101224",
          900: "#0a0b17",
          950: "#050509",
        },
        // Champagne — accent secondaire (boutons/badges), conservé : se
        // marie bien avec le marine.
        accent: {
          50: "#fbf9f5",
          100: "#f7f1e5",
          200: "#ebe0cb",
          300: "#dbcba8",
          400: "#cdbb94",
          500: "#c1ab83", // champagne
          600: "#a88e5e",
          700: "#8b7248",
          800: "#6e5a39",
          900: "#56472d",
          950: "#302818",
        },
        // Neutres froids quasi neutres (plus de teinte beige) — remplace la
        // palette "stone" par défaut de Tailwind, utilisée partout (fonds,
        // textes, bordures) : un seul point de réglage.
        stone: {
          50: "#fafaf9",
          100: "#f2f1ef",
          200: "#e5e3df",
          300: "#cdcac4",
          400: "#9e9b92",
          500: "#726f65",
          600: "#5a5750",
          700: "#45423c",
          800: "#302e29",
          900: "#1c1b18",
          950: "#100f0d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        lift: "0 10px 30px -12px rgb(16 18 36 / 0.25)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      maxWidth: {
        // Élargi pour les blocs de texte (accroches au-dessus des carousels,
        // liens du footer) — la valeur par défaut de Tailwind (42rem) les
        // rendait trop étroits pour les paragraphes de contenu réel.
        "2xl": "60rem",
      },
    },
  },
  plugins: [],
};

export default config;
