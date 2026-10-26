import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import ForgotPassword from "./pages/ForgotPassword";
import PortalEntry from "./pages/PortalEntry";
import RetailerDashboard from "./pages/RetailerDashboard";
import WholesalerDashboard from "./pages/WholesalerDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RequireRole from "./components/RequireRole";
import { dashboardPathForRole } from "./utils/dashboardPaths";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed && typeof parsed === "object") {
        setUser(parsed);
      } else {
        localStorage.removeItem("user");
      }
    } catch {
      localStorage.removeItem("user");
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {!user ? (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/portal" element={<PortalEntry />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <Navigate to={dashboardPathForRole(user.role)} replace />
              }
            />
            <Route
              path="/retailer"
              element={
                <RequireRole user={user} allowedRole="RETAILER">
                  <RetailerDashboard setUser={setUser} user={user} />
                </RequireRole>
              }
            />
            <Route
              path="/wholesaler"
              element={
                <RequireRole user={user} allowedRole="WHOLESALER">
                  <WholesalerDashboard setUser={setUser} user={user} />
                </RequireRole>
              }
            />
            <Route
              path="/delivery"
              element={
                <RequireRole user={user} allowedRole="DELIVERY">
                  <DeliveryDashboard setUser={setUser} user={user} />
                </RequireRole>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole user={user} allowedRole="ADMIN">
                  <AdminDashboard setUser={setUser} user={user} />
                </RequireRole>
              }
            />
            <Route
              path="*"
              element={
                <Navigate to={dashboardPathForRole(user.role)} replace />
              }
            />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
