import { createContext, useContext, useEffect, useState } from "react";

// Initialize the Context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Read initial theme from localStorage, default to dark for security tools
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("cyberxai_theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    return saved;
  });

  // Sync theme changes with the HTML DOM attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cyberxai_theme", theme);
  }, [theme]);

  // Reusable toggle function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for clean component consumption
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}