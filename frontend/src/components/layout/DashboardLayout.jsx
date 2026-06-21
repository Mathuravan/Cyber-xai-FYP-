import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ThemeToggle from "../ThemeToggle";
import "../../App.css";
import "../../styles/dashboard.css";

export default function DashboardLayout() {
  return (
    <div className="app dashboard-app">
      <Sidebar />

      <div className="main">
        <div className="theme-header-bar">
          <ThemeToggle />
        </div>

        <div className="workspace-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
