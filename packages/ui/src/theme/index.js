// @ts-check

/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  darkMode: "class",
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },
  extend: {
    transitionProperty: {
      width: "width",
      height: "height",
    },
    fontSize: {
      xxs: ["0.625rem", "0.75rem"],
    },
    colors: {
      dark: {
        blue: "#205EA6",
        orange: "#BC5215",
        red: "#AF3029",
        yellow: "#AD8301",
        green: "#66800B",
        cyan: "#24837B",
        purple: "#5E409D",
        magenta: "#A02F6F",
      },
      light: {
        blue: "#378abe",
        orange: "#DA702C",
        red: "#D14D41",
        yellow: "#D0A215",
        green: "#879A39",
        cyan: "#3AA99F",
        purple: "#8B7EC8",
        magenta: "#CE5D97",
      },
      border: "var(--border)",
      input: "var(--input)",
      ring: "var(--ring)",
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: {
        DEFAULT: "var(--primary)",
        foreground: "var(--primary-foreground)",
      },
      secondary: {
        DEFAULT: "var(--secondary)",
        foreground: "var(--secondary-foreground)",
      },
      tertiary: {
        DEFAULT: "var(--tertiary)",
        foreground: "var(--tertiary-foreground)",
      },
      destructive: {
        DEFAULT: "var(--destructive)",
        foreground: "var(--destructive-foreground)",
      },
      muted: {
        DEFAULT: "var(--muted)",
        foreground: "var(--muted-foreground)",
      },
      accent: {
        DEFAULT: "var(--accent)",
        foreground: "var(--accent-foreground)",
      },
      popover: {
        DEFAULT: "var(--popover)",
        foreground: "var(--popover-foreground)",
      },
      card: {
        DEFAULT: "var(--card)",
        foreground: "var(--card-foreground)",
      },
    },
    borderRadius: {
      lg: "0.5rem",
      md: "6px",
      sm: "4px",
    },
  },
};

module.exports = {
  theme,
};
