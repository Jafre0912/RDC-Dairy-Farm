import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    if (state.token) {
      config.headers["Authorization"] = `Bearer ${state.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      lastTokenValidation: null, // Track when we last validated the token

      // Login action
      login: async (email, password) => {
        set({ loading: true, error: null });

        try {
          const response = await api.post("/auth/login", { email, password });

          const { token, user } = response.data;
          
          if (!user || !user.role) {
            throw new Error("Incomplete user data received from server");
          }

          // Set auth header for future requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
            lastTokenValidation: Date.now(),
          });

          return { success: true, user };
        } catch (err) {
          const errorMessage =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Login failed";

          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      // Register action
      register: async (formData) => {
        set({ loading: true, error: null });

        try {
          const response = await api.post("/auth/register", formData);

          const { token, user } = response.data;

          // Set auth header for future requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
            lastTokenValidation: Date.now(),
          });

          return { success: true, user };
        } catch (err) {
          const errorMessage =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Registration failed";

          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      // Logout action
      logout: async () => {
        set({ loading: true });

        try {
          // Clean up state first to ensure we logout even if server request fails
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            lastTokenValidation: null,
          });

          // Remove auth header
          delete axios.defaults.headers.common["Authorization"];
          delete api.defaults.headers.common["Authorization"];

          // Call logout endpoint but don't wait for it
          api.get("/auth/logout").catch((err) => {
            console.warn("Logout notification failed:", err.message);
          });

          return { success: true };
        } catch (err) {
          console.error("Logout error:", err);
          return { success: true }; // Still consider logout successful
        }
      },

      // Fetch current user
      fetchUser: async () => {
        const { token, lastTokenValidation } = get();
        if (!token) return null;
        
        // Skip validation if we recently validated (within 5 minutes)
        const VALIDATION_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        if (
          lastTokenValidation && 
          Date.now() - lastTokenValidation < VALIDATION_THRESHOLD
        ) {
          return get().user;
        }

        set({ loading: true });

        try {
          // Ensure token is in headers
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          const response = await api.get("/auth/me");
          
          if (!response.data?.data) {
            throw new Error("Invalid user data received from server");
          }
          
          // Check if returned user has a role
          if (!response.data.data.role) {
            console.warn("User data missing role: ", response.data.data);
          }

          set({
            user: response.data.data,
            isAuthenticated: true,
            loading: false,
            lastTokenValidation: Date.now(),
          });

          return response.data.data;
        } catch (err) {
          console.error("Fetch user error:", err);
          
          if (err.response?.status === 401) {
            // Token invalid, clean up
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              error: null,
              lastTokenValidation: null,
            });
            
            delete axios.defaults.headers.common["Authorization"];
            delete api.defaults.headers.common["Authorization"];
          } else {
            set({ loading: false });
          }
          
          return null;
        }
      },

      // Clear error action
      clearError: () => set({ error: null }),
      
      // Force update user data (useful after role changes)
      updateUserData: (userData) => {
        if (!userData) return;
        
        set((state) => ({
          user: { ...state.user, ...userData },
          lastTokenValidation: Date.now(),
        }));
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastTokenValidation: state.lastTokenValidation,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth header after storage is rehydrated
        if (state?.token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
          api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
          
          // Verify token validity
          state.fetchUser();
        }
      },
    }
  )
);

export default useAuthStore;
