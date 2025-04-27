import { create } from "zustand";
import apiClient from "../config/axiosConfig";
import { z } from "zod";
import { toast } from "react-hot-toast";

// Define validation schemas with Zod
const MilkCollectionSchema = z.object({
  farmerId: z.number({ message: "Farmer ID is required" }),
  collectionDate: z.string().min(1, "Collection date is required"),
  shift: z.enum(["morning", "evening"], {
    errorMap: () => ({ message: "Shift must be either morning or evening" }),
  }),
  milkType: z.enum(["C", "B", "M"], {
    errorMap: () => ({ message: "Milk type must be C, B, or M" }),
  }),
  fat: z
    .number({
      required_error: "Fat is required",
      invalid_type_error: "Fat must be a number",
    })
    .min(0, "Fat cannot be negative"),
  snf: z
    .number({
      required_error: "SNF is required",
      invalid_type_error: "SNF must be a number",
    })
    .min(0, "SNF cannot be negative"),
  quantity: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .min(0, "Quantity cannot be negative"),
});

const useMPPStore = create((set, get) => ({
  // State
  milkCollections: [],
  activeMilkCollection: null,
  stats: null,
  shiftStats: null,
  isLoading: false,
  error: null,
  validationErrors: null,
  filters: {
    startDate: "",
    endDate: "",
    farmerId: "",
    shift: "",
    milkType: "",
  },

  // Actions
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  clearFilters: () =>
    set({
      filters: {
        startDate: "",
        endDate: "",
        farmerId: "",
        shift: "",
        milkType: "",
      },
    }),

  setValidationErrors: (errors) => set({ validationErrors: errors }),

  // Create new milk collection
  createMilkCollection: async (data) => {
    try {
      set({ isLoading: true, error: null, validationErrors: null });

      // Validate data
      const validationResult = MilkCollectionSchema.safeParse(data);
      if (!validationResult.success) {
        const errors = validationResult.error.format();
        set({ validationErrors: errors, isLoading: false });
        return { success: false, errors };
      }

      const response = await apiClient.post("/mpp/collection", data);

      // Refresh collections list
      get().fetchMilkCollections();

      set({ isLoading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error creating milk collection:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create milk collection";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Fetch milk collections with optional filters
  fetchMilkCollections: async (customFilters = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Combine store filters with custom filters
      const { startDate, endDate, farmerId, shift, milkType } = {
        ...get().filters,
        ...customFilters,
      };

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (farmerId) params.append("farmerId", farmerId);
      if (shift) params.append("shift", shift);
      if (milkType) params.append("milkType", milkType);

      const response = await apiClient.get(
        `/mpp/collection?${params.toString()}`
      );

      set({
        milkCollections: response.data.data,
        isLoading: false,
      });

      return response.data.data;
    } catch (error) {
      console.error("Error fetching milk collections:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch milk collections";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return [];
    }
  },

  // Fetch a single milk collection
  fetchMilkCollection: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get(`/mpp/collection/${id}`);

      set({
        activeMilkCollection: response.data.data,
        isLoading: false,
      });

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching milk collection with ID ${id}:`, error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch milk collection";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },

  // Update milk collection
  updateMilkCollection: async (id, data) => {
    try {
      set({ isLoading: true, error: null, validationErrors: null });

      // Only validate fields that are provided
      const fieldsToValidate = {};
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          fieldsToValidate[key] = data[key];
        }
      }

      // Partial validation for update
      const schema = MilkCollectionSchema.partial();
      const validationResult = schema.safeParse(fieldsToValidate);

      if (!validationResult.success) {
        const errors = validationResult.error.format();
        set({ validationErrors: errors, isLoading: false });
        return { success: false, errors };
      }

      const response = await apiClient.put(`/mpp/collection/${id}`, data);

      // Update local state if needed
      if (get().activeMilkCollection?._id === id) {
        set({ activeMilkCollection: response.data.data });
      }

      // Refresh collections list
      get().fetchMilkCollections();

      set({ isLoading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error(`Error updating milk collection with ID ${id}:`, error);
      const errorMessage =
        error.response?.data?.message || "Failed to update milk collection";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Delete milk collection
  deleteMilkCollection: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await apiClient.delete(`/mpp/collection/${id}`);

      // Update local state to remove deleted collection
      set({
        milkCollections: get().milkCollections.filter(
          (item) => item._id !== id
        ),
        isLoading: false,
      });

      // Clear active collection if it was the one deleted
      if (get().activeMilkCollection?._id === id) {
        set({ activeMilkCollection: null });
      }

      toast.success("Milk collection deleted successfully");
      return { success: true };
    } catch (error) {
      console.error(`Error deleting milk collection with ID ${id}:`, error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete milk collection";
      set({
        error: errorMessage,
        isLoading: false,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Fetch milk collection statistics
  fetchStats: async (customFilters = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Combine store filters with custom filters
      const { startDate, endDate, farmerId } = {
        ...get().filters,
        ...customFilters,
      };

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (farmerId) params.append("farmerId", farmerId);

      const response = await apiClient.get(
        `/mpp/collection/stats?${params.toString()}`
      );

      set({
        stats: response.data.data,
        isLoading: false,
      });

      return response.data.data;
    } catch (error) {
      console.error("Error fetching milk collection stats:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch statistics";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },

  // Fetch milk collection by shift
  fetchShiftStats: async (customFilters = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Combine store filters with custom filters
      const { startDate, endDate, farmerId } = {
        ...get().filters,
        ...customFilters,
      };

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (farmerId) params.append("farmerId", farmerId);

      const response = await apiClient.get(
        `/mpp/collection/by-shift?${params.toString()}`
      );

      set({
        shiftStats: response.data.data,
        isLoading: false,
      });

      return response.data.data;
    } catch (error) {
      console.error("Error fetching milk collection shift stats:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch shift statistics";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },

  // Fetch rate for given fat/snf values
  fetchRate: async (fat, snf) => {
    try {
      const response = await apiClient.get(`/fat/snf?fat=${fat}&snf=${snf}`);
      return response.data.data.rate;
    } catch (error) {
      console.error("Error fetching rate:", error);
      toast.error("Failed to fetch rate for the given fat and SNF values");
      return 0;
    }
  },

  // Fetch available FAT and SNF values
  fetchAvailableValues: async () => {
    try {
      const response = await apiClient.get(`/fat/snf/values`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching available FAT/SNF values:", error);
      toast.error("Failed to fetch available FAT and SNF values");
      return { fat: [], snf: [] };
    }
  },

  // Clear errors
  clearErrors: () => set({ error: null, validationErrors: null }),

  // Reset store
  reset: () =>
    set({
      milkCollections: [],
      activeMilkCollection: null,
      stats: null,
      shiftStats: null,
      isLoading: false,
      error: null,
      validationErrors: null,
      filters: {
        startDate: "",
        endDate: "",
        farmerId: "",
        shift: "",
        milkType: "",
      },
    }),

  // Fetch total MPP amount for finance display
  fetchMPPFinanceTotal: async (startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      
      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await apiClient.get(`/mpp/finance/total?${params.toString()}`);
      
      set({ isLoading: false });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching MPP finance total:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch MPP finance total";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },
}));

export default useMPPStore;
