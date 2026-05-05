module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0c1510",
        surface: "#161B22",
        surfaceContainer: "#19221c",
        surfaceContainerLow: "#151e18",
        surfaceContainerHigh: "#232c26",
        onSurface: "#dbe5db",
        onBackground: "#dbe5db",
        primary: "#cdffde",
        primaryContainer: "#00f5a0",
        secondaryContainer: "#14d1ff",
        error: "#ffb4ab",
        errorContainer: "#93000a",
        outline: "#849588",
      },
      borderRadius: {
        xl: "0.75rem",
        '2xl': "1rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        label: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 60px -30px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
