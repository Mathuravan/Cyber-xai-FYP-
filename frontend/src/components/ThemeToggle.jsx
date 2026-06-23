import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ floating = false }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${floating ? "theme-toggle-floating" : ""}`}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
