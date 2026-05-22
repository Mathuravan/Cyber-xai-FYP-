import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ProtectedRoute from "./utils/ProtectedRoute"
import DashboardLayout from "./components/layout/DashboardLayout"
import DashboardHome from "./pages/DashboardHome"
import SinglePredict from "./pages/SinglePredict"
import BatchUpload from "./pages/BatchUpload"
import LogsPage from "./pages/LogsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="predict" element={<SinglePredict />} />
            <Route path="batch" element={<BatchUpload />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}