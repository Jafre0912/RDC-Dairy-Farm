import { create } from "zustand";
import apiClient from "../config/axiosConfig";

const useDashboardStore = create((set, get) => ({
  // State
  dashboardData: {
    totalCattle: 0,
    milkProduction: 0,
    revenue: 0,
    activeTasks: 0,
    milkProductionTrend: [],
    healthAlerts: []
  },
  isLoading: false,
  error: null,

  // Actions
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use the new unified dashboard endpoint
      const response = await apiClient.get("/dashboard/stats");
      const data = response.data.data || {};
      
      // Format milk trend data for chart (with safety checks)
      const milkTrend = data.milkTrend || [];
      const formattedMilkTrend = milkTrend.length > 0
        ? milkTrend.map(day => ({
            day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
            liters: day.totalProduction || 0
          })).slice(-7) // Get last 7 days
        : [];
      
      // Extract cattle stats with safety checks
      const cattleStats = data.cattleStats || {};
      const milkProduction = data.milkProduction || {};
      const financeStats = data.financeStats || {};
      
      // Update dashboard data
      set({
        dashboardData: {
          totalCattle: cattleStats.totalCattle || 0,
          healthyCattle: cattleStats.healthyCattle || 0,
          sickCattle: cattleStats.sickCattle || 0,
          milkProduction: milkProduction.avgProduction ? parseFloat(milkProduction.avgProduction).toFixed(0) : 0,
          revenue: financeStats.totalIncome || 0,
          activeTasks: cattleStats.sickCattle || 0, // Using sick cattle as active tasks
          milkProductionTrend: formattedMilkTrend,
          healthAlerts: data.healthAlerts || []
        },
        isLoading: false
      });
      
      return get().dashboardData;
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      set({
        error: error.response?.data?.message || error.message || "Failed to load dashboard data",
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));

export default useDashboardStore; 