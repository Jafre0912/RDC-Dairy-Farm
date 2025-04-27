import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./components/Pages/Auth/Login";
import Home from "./components/Pages/Home/Home";
import Layout from "./Layout";
import Register from "./components/Pages/Auth/Register";
import Dashboard from "./components/Pages/Dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLayout from "./components/Pages/Auth/AuthLayout";
import DashboardLayout from "./components/Pages/Dashboard/DashBoardLayout";
import Profile from "./components/Pages/Profile/Profile";
import ProfileSettings from "./components/Pages/Profile/ProfileSettings";
import Cattle from "./components/Pages/Dashboard/Cattle/Cattle";
import MilkManagement from "./components/Pages/Dashboard/MilkManagement";
import CattleDetails from "./components/Pages/Dashboard/Cattle/ViewCattleDetails";
import EditCattle from "./components/Pages/Dashboard/Cattle/EditCattle";
import Finance from "./components/Pages/Dashboard/Finance";
import DiseasePrediction from "./components/Pages/Disease/DiseasePrediction";
import PredictionHistory from "./components/Pages/Disease/PredictionHistory";
import PredictionDetail from "./components/Pages/Disease/PredictionDetail";
import VeterinaryServices from "./components/Pages/Dashboard/VeterinaryServices";
import AdminLayout from "./components/Pages/Admin/AdminLayout";
import AdminDashboard from "./components/Pages/Admin/AdminDashboard";
import UserManagement from "./components/Pages/Admin/UserManagement";
import AdminSettings from "./components/Pages/Admin/AdminSettings";
import VeterinaryLocations from "./components/Pages/Admin/VeterinaryLocations";
import FarmerMilkTransactions from "./components/Pages/Admin/FarmerMilkTransactions";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import HomeRedirect from "./components/HomeRedirect";
import AppLayout from "./AppLayout";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeRedirect />} />
        <Route path="home" element={<Home />} />
      </Route>

      {/* Auth Routes */}
      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Register />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/cattle" element={<Cattle />} />
          <Route path="/dashboard/cattle/:id" element={<CattleDetails />} />
          <Route path="/dashboard/cattle/edit/:id" element={<EditCattle />} />
          <Route
            path="dashboard/milk-management"
            element={<MilkManagement />}
          />
          <Route path="dashboard/finance" element={<Finance />} />
          <Route
            path="dashboard/disease-prediction"
            element={<DiseasePrediction />}
          />
          <Route
            path="dashboard/disease-history"
            element={<PredictionHistory />}
          />
          <Route
            path="/dashboard/disease-prediction-detail/:id"
            element={<PredictionDetail />}
          />
          <Route
            path="dashboard/veterinary-services"
            element={<VeterinaryServices />}
          />
          <Route
            path="dashboard/profile-settings"
            element={<ProfileSettings />}
          />
          {/* Redirect old profile and settings routes to the new combined page */}
          <Route
            path="dashboard/profile"
            element={<Navigate to="/dashboard/profile-settings" replace />}
          />
          <Route
            path="dashboard/settings"
            element={<Navigate to="/dashboard/profile-settings" replace />}
          />
          {/* Redirect old milk routes to the new combined page */}
          <Route
            path="dashboard/milk-production"
            element={<Navigate to="/dashboard/milk-management" replace />}
          />
          <Route
            path="dashboard/mpp"
            element={<Navigate to="/dashboard/milk-management?tab=1" replace />}
          />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/veterinary-locations" element={<VeterinaryLocations />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/profile" element={<Profile />} />
          <Route path="admin/farmers/:farmerId/milk-transactions" element={<FarmerMilkTransactions />} />
        </Route>
      </Route>
      {/* Role-based redirects */}
      <Route path="*" element={<RoleBasedRedirect />} />
    </Route>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Toaster position="top-right" />
    <RouterProvider router={router} />
  </StrictMode>
);
