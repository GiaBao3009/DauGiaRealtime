/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0d59f2",
        "primary-hover": "#0b4dd4",
        "background-light": "#f5f6f8",
        "background-dark": "#0a0e17",
        "surface-dark": "#111827",
        "surface-border": "#1f2937",
        "surface-highlight": "#1a2332",
        "card-dark": "#111827",
        "input-dark": "#1a2332",
        "text-secondary": "#9ca3af",
        "text-muted": "#6b7280",
        "border-dark": "#1f2937",
        "success": "#10b981",
        "danger": "#ef4444",
        "warning": "#f59e0b"
      },
      fontFamily: {
        "display": ["Manrope", "system-ui", "sans-serif"],
        "body": ["Noto Sans", "system-ui", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        'glow': '0 0 20px rgba(13, 89, 242, 0.3)',
        'glow-lg': '0 0 40px rgba(13, 89, 242, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}