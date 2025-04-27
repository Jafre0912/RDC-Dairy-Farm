import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

/**
 * A component that redirects users based on their role
 */
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Redirect based on user role
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  
  // Default redirect for regular users
  return <Navigate to="/dashboard" replace />;
};

export default RoleBasedRedirect; 