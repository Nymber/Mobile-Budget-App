module.exports = {
  content: ["./app/**/*.{html,js,jsx,ts,tsx}"], // Adjust paths to match your project structure
  theme: {
    extend: {
      borderColor: {
        border: 'hsl(215, 20%, 85%)', // Define the custom border color
        ring: 'hsl(212, 95%, 60%)', // Define the ring color
      },
      colors: {
        border: 'hsl(0, 0%, 80%)', // Define the border color
        background: 'hsl(0, 0%, 98%)', // Define the background color
        foreground: 'hsl(0, 0%, 15%)', // Define the foreground color
        primary: {
          DEFAULT: 'hsl(212, 95%, 50%)', // Define the primary color
          foreground: 'hsl(0, 0%, 100%)', // Define the primary foreground color
          hover: 'hsl(212, 95%, 45%)', // Define the hover state for primary
          light: 'hsl(212, 95%, 90%)', // Define a lighter shade for primary
        },
      },
    },
  },
  plugins: [],
};