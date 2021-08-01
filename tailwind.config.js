const production = !process.env.ROLLUP_WATCH;
const colors = require('tailwindcss/colors')

module.exports = {
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  theme: {
    extend: {
      colors: {
        change: 'black',
        amber: colors.amber,
        yellow: {
          DEFAULT: "#fbbf24"
        },
        gray: {
          DEFAULT: "#111827",
          light: "#6b7280",
        }
      },
    },
    fontFamily: {
      'sans': "montserrat, helvetica, arial, sans-serif",
    }
  },
  plugins: [

  ],
  purge: {
    content: [
     "./src/**/*.svelte",

    ],
    enabled: production // disable purge in dev
  },
};