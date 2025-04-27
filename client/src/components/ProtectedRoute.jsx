import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { toast } from "react-hot-toast";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, user, fetchUser } = useAuthStore();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isRegularRoute = location.pathname.startsWith("/dashboard");

  // Verify user role and authentication on mount
  useEffect(() => {
    async function verifyUserAndRole() {
      try {
        setLoading(true);
        
        // If not authenticated, no need to proceed
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }
        
        // First, refresh user data from localStorage if possible
        await fetchUser();
        
        // Then double-check with server
        try {
          const response = await axios.get(`${API_URL}/auth/check-role`, {
            withCredentials: true
          });
          
          const serverRole = response.data?.data?.role;
          
          // Update role from server response
          if (serverRole) {
            setRole(serverRole);
          } else {
            // Fall back to client-side role if server doesn't return one
            setRole(user?.role || null);
          }
        } catch (error) {
          console.error("Role verification error:", error);
          // Fall back to client-side role
          setRole(user?.role || null);
        }
      } catch (error) {
        console.error("Auth verification error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    verifyUserAndRole();
  }, [isAuthenticated, fetchUser, user?.role]);

  // Show spinner while loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-green-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  // Use the verified role or fall back to user.role
  const userRole = role || user?.role;

  // Admin-only route check
  if (isAdminRoute && userRole !== "admin") {
    toast.error(`Access denied. Admin permissions required. Your role: ${userRole || 'none'}`);
    return <Navigate to="/dashboard" replace />;
  }

  // Regular user route check - only apply when on dashboard routes
  if (isRegularRoute && userRole === "admin") {
    toast.error("As an admin, please use the admin dashboard.");
    return <Navigate to="/admin" replace />;
  }

  // Additional role check for specific routes
  if (requiredRole && userRole !== requiredRole) {
    toast.error(`Access denied. ${requiredRole} permissions required.`);
    return <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
