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
  plugins: [
    // Set a default value on the `:root` element
    ({ addBase }) => addBase({ ":root": "--radius: 0.5rem" }),
    ({ addBase }) => addBase({ ":root": "--background: #ffffff" }),
    ({ addBase }) => addBase({ ":root": "--foreground: 	#020817" }),
    ({ addBase }) => addBase({ ":root": "--primary: #000000" }),
    ({ addBase }) => addBase({ ":root": "--primary-foreground: #f8fafc" }),
    ({ addBase }) => addBase({ ":root": "--secondary: #7d7d7d" }),
    ({ addBase }) => addBase({ ":root": "--secondary-foreground: #f8fafc" }),
    ({ addBase }) => addBase({ ":root": "--tertiary: #f0f2f5" }),
    ({ addBase }) => addBase({ ":root": "--tertiary-foreground: 	#0f172a" }),
    ({ addBase }) => addBase({ ":root": "--muted: 	#f1f5f9" }),
    ({ addBase }) => addBase({ ":root": "--muted-foreground: 	#64748b" }),
    ({ addBase }) => addBase({ ":root": "--accent: 	#f1f5f9" }),
    ({ addBase }) => addBase({ ":root": "--accent-foreground: 	#0f172a" }),
    ({ addBase }) => addBase({ ":root": "--destructive: #ef4444" }),
    ({ addBase }) => addBase({ ":root": "--destructive-foreground: #f8fafc" }),
    ({ addBase }) => addBase({ ":root": "--border: 	#e2e8f0" }),
    ({ addBase }) => addBase({ ":root": "--input: 	#e2e8f0" }),
    ({ addBase }) => addBase({ ":root": "--ring: #cccccc" }),
    ({ addBase }) => addBase({ ":root": "--popover: 	#ffffff" }),
    ({ addBase }) => addBase({ ":root": "--popover-foreground: 	#020817" }),
    ({ addBase }) => addBase({ ":root": "--card: 	#ffffff" }),
    ({ addBase }) => addBase({ ":root": "--card-foreground: 	#020817" }),
    require("tailwindcss-animate"),
  ],
};

module.exports = {
  theme,
};
