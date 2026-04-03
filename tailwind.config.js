/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        oracle: {
          bg: '#ffffff',      
          paper: '#000000',   
          text: '#333333',    
          dim: '#666666',     
          border: '#e5e5e5',  
          accent: '#000000',  
          red: '#000000'      
        }
      }
    },
  },
  plugins: [],
};
