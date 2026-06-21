import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Route Protection
import ProtectedRoute from "./utils/ProtectedRoute";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Dashboard Pages
import DashboardHome from "./pages/DashboardHome";
import SinglePredict from "./pages/SinglePredict";
import BatchUpload from "./pages/BatchUpload";
import LogsPage from "./pages/LogsPage";
import ModelMetrics from "./pages/ModelMetrics";
import Notifications from "./pages/Notifications";
import ThreatVisualization from "./pages/ThreatVisualization";
import SecurityCenter from "./pages/SecurityCenter";
import AuditDashboard from "./pages/AuditDashboard";
import XaiComparison from "./pages/XaiComparison";
import ResilienceDashboard from "./pages/ResilienceDashboard";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Mapping */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Main Application Core */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="model-metrics" element={<ModelMetrics />} />
              <Route path="security-center" element={<SecurityCenter />} />
              <Route path="predict" element={<SinglePredict />} />
              <Route path="batch" element={<BatchUpload />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="threat-visualization" element={<ThreatVisualization />} />
              <Route path="xai-comparison" element={<XaiComparison />} />
              <Route path="audit-dashboard" element={<AuditDashboard />} />
              <Route path="resilience" element={<ResilienceDashboard />} />
            </Route>
          </Route>

          {/* Universal Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;