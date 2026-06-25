import { NavLink, useNavigate } from "react-router-dom"
import { clearAuth } from "../../services/authService"
import "../../styles/sidebar.css"

const MENU_ITEMS = [
  {
    to: "/dashboard",
    label: "Overview",
    desc: "System health & dashboard stats",
    icon: "O",
    end: true,
  },
  {
    to: "/dashboard/model-metrics",
    label: "Model Performance",
    desc: "Accuracy, F1, confusion matrix",
    icon: "M",
  },
  {
    to: "/dashboard/predict",
    label: "Single Predict",
    desc: "Analyse one network flow",
    icon: "P",
  },
  {
    to: "/dashboard/batch",
    label: "Batch CSV",
    desc: "Upload & scan multiple rows",
    icon: "B",
  },
  {
    to: "/dashboard/logs",
    label: "Logs",
    desc: "Prediction & audit history",
    icon: "L",
  },
  {
    to: "/dashboard/notifications",
    label: "Security Notifications",
    desc: "Dashboard threat alerts",
    icon: "N",
  },
  {
    to: "/dashboard/threat-visualization",
    label: "Threat Visualization",
    desc: "Charts & attack heatmaps",
    icon: "V",
  },
  {
    to: "/dashboard/security-center",
    label: "Security Center",
    desc: "Guidance & response actions",
    icon: "S",
  },
  {
    to: "/dashboard/xai-comparison",
    label: "Dual-XAI Benchmarking",
    desc: "SHAP vs LIME side-by-side",
    icon: "X",
  },
  {
    to: "/dashboard/resilience",
    label: "Model Resilience Testing",
    desc: "Poisoning, evasion & OOD tests",
    icon: "R",
  },
  {
    to: "/dashboard/audit-dashboard",
    label: "Audit Dashboard",
    desc: "Compliance & access records",
    icon: "A",
  },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate("/")
  }

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">CX</span>
        <span className="logo">CyberXAI</span>
      </div>

      <p className="sidebar-section-label">NAVIGATION</p>

      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="menu-item-icon">{item.icon}</span>
            <span className="menu-item-text">
              <span className="menu-item-label">{item.label}</span>
              <span className="menu-item-desc">{item.desc}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="menu-item sidebar-logout"
        onClick={handleLogout}
      >
        <span className="menu-item-icon">Q</span>
        <span className="menu-item-text">
          <span className="menu-item-label">Log out</span>
          <span className="menu-item-desc">End your session</span>
        </span>
      </button>
    </div>
  )
}
