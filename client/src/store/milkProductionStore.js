import { create } from "zustand";
import apiClient from "../config/axiosConfig";
import { z } from "zod";

// Define validation schemas with Zod
const MilkProductionSchema = z.object({
  cattleId: z.string().min(1, "Cattle ID is required"),
  date: z.string().min(1, "Date is required"),
  shift: z.enum(
    ["morning", "evening"],
    "Shift must be either 'morning' or 'evening'"
  ),
  morningAmount: z.number().nonnegative().optional().nullable(),
  eveningAmount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const BulkMilkProductionSchema = z.object({
  records: z
    .array(MilkProductionSchema)
    .min(1, "At least one record is required"),
});

const useMilkProductionStore = create((set, get) => ({
  // State
  milkProductions: [],
  activeMilkProduction: null,
  stats: null,
  dailySummary: null,
  monthlySummary: null,
  isLoading: false,
  error: null,
  validationErrors: null,
  filters: {
    startDate: "",
    endDate: "",
    cattleId: "",
  },

  // Actions
  setFilters: (filters) =>
    set({
      filters: { ...get().filters, ...filters },
    }),

  clearFilters: () =>
    set({
      filters: { startDate: "", endDate: "", cattleId: "" },
    }),

  setValidationErrors: (errors) => set({ validationErrors: errors }),

  fetchMilkProductions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const queryParams = new URLSearchParams();

      // Add filters to query params if they exist
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.cattleId) queryParams.append("cattleId", filters.cattleId);

      const response = await apiClient.get(
        `/milk-production?${queryParams.toString()}`
      );
      set({
        milkProductions: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch milk production records",
        isLoading: false,
      });
      return [];
    }
  },

  getMilkProductionById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/milk-production/${id}`);
      set({
        activeMilkProduction: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch milk production details",
        isLoading: false,
      });
      return null;
    }
  },

  getMilkProductionByCattle: async (cattleId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(
        `/milk-production/cattle/${cattleId}`
      );
      set({
        milkProductions: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch milk production for cattle",
        isLoading: false,
      });
      return [];
    }
  },

  getStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/milk-production/stats");
      set({
        stats: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch milk production statistics",
        isLoading: false,
      });
      return null;
    }
  },

  getDailySummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/milk-production/daily-summary");
      set({
        dailySummary: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch daily milk production summary",
        isLoading: false,
      });
      return null;
    }
  },

  getMonthlySummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/milk-production/monthly-summary");
      set({
        monthlySummary: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch monthly milk production summary",
        isLoading: false,
      });
      return null;
    }
  },

  validateMilkProductionData: (data) => {
    try {
      // Validate and parse the data
      const validData = MilkProductionSchema.parse(data);
      set({ validationErrors: null });
      return { valid: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          formattedErrors[path] = err.message;
        });
        set({ validationErrors: formattedErrors });
        return { valid: false, errors: formattedErrors };
      }
      set({ validationErrors: { general: "Validation failed" } });
      return { valid: false, errors: { general: "Validation failed" } };
    }
  },

  validateBulkMilkProductionData: (data) => {
    try {
      // Validate and parse the data
      const validData = BulkMilkProductionSchema.parse(data);
      set({ validationErrors: null });
      return { valid: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          formattedErrors[path] = err.message;
        });
        set({ validationErrors: formattedErrors });
        return { valid: false, errors: formattedErrors };
      }
      set({ validationErrors: { general: "Validation failed" } });
      return { valid: false, errors: { general: "Validation failed" } };
    }
  },

  createMilkProduction: async (milkProductionData) => {
    // Validate the data first
    const validation = get().validateMilkProductionData(milkProductionData);

    if (!validation.valid) {
      set({
        error: "Validation failed. Please check the form.",
        isLoading: false,
      });
      return { success: false, errors: validation.errors };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        "/milk-production",
        validation.data
      );
      const newRecord = response.data.data || response.data;

      set((state) => ({
        milkProductions: [...state.milkProductions, newRecord],
        isLoading: false,
        validationErrors: null,
      }));

      return { success: true, data: newRecord };
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create milk production record",
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  createBulkMilkProduction: async (records) => {
    // Validate the data first
    const validation = get().validateBulkMilkProductionData({ records });

    if (!validation.valid) {
      set({
        error: "Validation failed. Please check the form.",
        isLoading: false,
      });
      return { success: false, errors: validation.errors };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        "/milk-production/bulk",
        validation.data
      );
      const newRecords = response.data.data || response.data;

      set((state) => ({
        milkProductions: [...state.milkProductions, ...newRecords],
        isLoading: false,
        validationErrors: null,
      }));

      return { success: true, data: newRecords };
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create bulk milk production records",
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateMilkProduction: async (id, milkProductionData) => {
    // Partial validation for updates
    const validation = get().validateMilkProductionData({
      ...get().activeMilkProduction,
      ...milkProductionData,
    });

    if (!validation.valid) {
      set({
        error: "Validation failed. Please check the form.",
        isLoading: false,
      });
      return { success: false, errors: validation.errors };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(
        `/milk-production/${id}`,
        validation.data
      );
      const updatedRecord = response.data.data || response.data;

      set((state) => ({
        milkProductions: state.milkProductions.map((record) =>
          record._id === id ? updatedRecord : record
        ),
        activeMilkProduction: updatedRecord,
        isLoading: false,
        validationErrors: null,
      }));

      return { success: true, data: updatedRecord };
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update milk production record",
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteMilkProduction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/milk-production/${id}`);

      set((state) => ({
        milkProductions: state.milkProductions.filter(
          (record) => record._id !== id
        ),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete milk production record",
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Reset active milk production
  resetActiveMilkProduction: () => set({ activeMilkProduction: null }),

  // Clear errors
  clearErrors: () => set({ error: null, validationErrors: null }),
}));

export default useMilkProductionStore;
