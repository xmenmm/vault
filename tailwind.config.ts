import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  corePlugins: {
    // We ship our own base resets in globals.css; skip Tailwind preflight so it
    // doesn't clobber the dashboard's custom component CSS.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Namespaced (--ui-*) so they don't collide with the dashboard's own
        // hex CSS vars (--border, --muted, …).
        border: 'hsl(var(--ui-border))',
        input: 'hsl(var(--ui-input))',
        ring: 'hsl(var(--ui-ring))',
        background: 'hsl(var(--ui-background))',
        foreground: 'hsl(var(--ui-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--ui-primary))',
          foreground: 'hsl(var(--ui-primary-foreground))',
        },
        muted: {
          foreground: 'hsl(var(--ui-muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--ui-card))',
          foreground: 'hsl(var(--ui-card-foreground))',
        },
      },
      keyframes: {
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%,-40%) scale(1)' },
        },
      },
      animation: {
        spotlight: 'spotlight 2s ease 0.75s 1 forwards',
      },
    },
  },
  plugins: [],
};

export default config;
