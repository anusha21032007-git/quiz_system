import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6C8BFF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E38AD6",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF6B8A",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#7A80B8",
          foreground: "#7A80B8",
        },
        accent: {
          DEFAULT: "#6C8BFF",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.65)",
          foreground: "#1E2455",
        },
        sidebar: {
          DEFAULT: "linear-gradient(to bottom, #8EA2FF, #B39DDB)",
          foreground: "#1E2455",
          primary: "#6C8BFF",
          "primary-foreground": "#FFFFFF",
          accent: "rgba(255, 255, 255, 0.2)",
          "accent-foreground": "#6C8BFF",
          border: "rgba(255, 255, 255, 0.2)",
          ring: "#6C8BFF",
        },
        success: {
          DEFAULT: "#4EE3B2",
        },
        warning: {
          DEFAULT: "#FFB86C",
        },
        info: {
          DEFAULT: "#6C8BFF",
        },
        rank: {
          gold: "#FFD700",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },
        pastel: {
          blue: "#A7B7FF",
          lavender: "#C6B4F7",
          pink: "#F2B7E8",
          royal: "#6C8BFF",
          purple: "#E38AD6",
        }
      },
      borderRadius: {
        "20": "20px",
        xl: "12px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 12px 30px rgba(0, 0, 0, 0.08)',
        'glass-hover': '0 20px 40px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
