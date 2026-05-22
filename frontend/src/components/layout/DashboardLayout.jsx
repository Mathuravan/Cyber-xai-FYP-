import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import "../../App.css"
import "../../styles/dashboard.css"

export default function DashboardLayout() {
  return (
    <div className="app dashboard-app">
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
    </div>
  )
}