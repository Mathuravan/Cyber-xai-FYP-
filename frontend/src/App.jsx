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

            {/* Single Prediction */}
            <Route path="predict" element={<SinglePredict />} />

            {/* Batch Prediction */}
            <Route path="batch" element={<BatchUpload />} />

            {/* Logs */}
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;