import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../../App.css";
import "../../styles/dashboard.css";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app dashboard-app">
      {/* Navigation Sidebar */}
      <Sidebar />

      <div className="main">
        {/* Dynamic Top Navigation Header Bar (Replaces old inline-styled div) */}
        <div className="theme-header-bar">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
        
        {/* Main Workspace Target Outlet */}
        <div className="workspace-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}