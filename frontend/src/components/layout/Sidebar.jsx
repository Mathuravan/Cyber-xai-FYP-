import { NavLink, useNavigate } from "react-router-dom"
import { clearAuth } from "../../services/authService"

const MENU_ITEMS = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/model-metrics", label: "Model Performance" },
  { to: "/dashboard/predict", label: "Single Predict" },
  { to: "/dashboard/batch", label: "Batch CSV" },
  { to: "/dashboard/logs", label: "Logs" },
  { to: "/dashboard/notifications", label: "Security Notifications" },
  { to: "/dashboard/threat-visualization", label: "Threat Visualization" },
  { to: "/dashboard/security-center", label: "Security Center" },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate("/")
  }

  return (
    <div className="sidebar">
      <div className="logo">CyberXAI</div>

      <div className="sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `menu ${isActive ? "active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <button
        type="button"
        className="menu sidebar-logout"
        onClick={handleLogout}
      >
        Log out
      </button>
    </div>
  )
}