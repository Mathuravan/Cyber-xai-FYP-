const MENU_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "predict", label: "Single predict" },
  { id: "batch", label: "Batch CSV" },
  { id: "logs", label: "Attack logs" },
]

export default function Sidebar({ activeMenu, onMenuClick, onLogout }) {
  return (
    <div className="sidebar">
      <div className="logo">CyberXAI</div>

      <div className="sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`menu ${activeMenu === item.id ? "active" : ""}`}
            onClick={() => onMenuClick(item.id)}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="menu sidebar-logout" onClick={onLogout}>
        Log out
      </div>
    </div>
  )
}