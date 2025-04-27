import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

/**
 * A component that handles home page redirection based on authentication status
 */
const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuthStore();

  // If not authenticated, show the public home page
  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // If authenticated, redirect based on role
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // For regular users
  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect; 