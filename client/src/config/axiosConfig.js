import axios from "axios";
import useAuthStore from "../store/authStore";

const API_URL = "http://localhost:5000/api";

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token from Zustand store
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Zustand store
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      message: error.response?.data?.message || error.message,
    });

    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request detected, logging out...");
      // Use the logout function from auth store
      const auth = useAuthStore.getState();
      console.log("Current auth state:", {
        isAuthenticated: auth.isAuthenticated,
        hasToken: !!auth.token,
      });
      auth.logout();
      window.location = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
