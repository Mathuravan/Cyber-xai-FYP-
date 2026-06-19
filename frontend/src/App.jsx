import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ================= PROTECTED ROUTES ================= */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Dashboard Overview */}
            <Route index element={<DashboardHome />} />

            {/* Model Performance */}
            <Route path="model-metrics" element={<ModelMetrics />} />

            {/* Security center */}
            <Route path="security-center"element={<SecurityCenter />} />

            {/* Single Prediction */}
            <Route path="predict" element={<SinglePredict />} />

            {/* Batch Prediction */}
            <Route path="batch" element={<BatchUpload />} />

            {/* Logs */}
            <Route path="logs" element={<LogsPage />} />

            {/* Security Notifications */}
            <Route path="notifications" element={<Notifications />} />

            {/* Threat Visualization */}
            <Route
              path="threat-visualization"
              element={<ThreatVisualization />}
            />

            {/* Dual-XAI Benchmarking */}
            <Route
              path="xai-comparison"
              element={<XaiComparison />}
            />

            <Route path="audit-dashboard" element={<AuditDashboard />} />

            {/* Model Resilience Testing */}
            <Route
              path="resilience"
              element={<ResilienceDashboard />}
            />
          </Route>
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
