import { create } from "zustand";
import apiClient from "../config/axiosConfig";
import { z } from "zod";

// Define validation schemas with Zod
const PurchaseInfoSchema = z.object({
  date: z.string().optional().nullable(),
  cost: z.number().nonnegative().optional().nullable(),
  source: z.string().optional().nullable(),
});

const HealthStatusSchema = z.object({
  status: z
    .enum(["healthy", "sick", "quarantined", "pregnant"])
    .default("healthy"),
  vaccinations: z
    .array(
      z.object({
        name: z.string().min(1, "Vaccination name is required"),
        date: z.string().min(1, "Vaccination date is required"),
      })
    )
    .optional()
    .default([]),
  medicalHistory: z
    .array(
      z.object({
        condition: z.string().min(1, "Condition is required"),
        treatment: z.string().optional(),
        date: z.string().min(1, "Date is required"),
      })
    )
    .optional()
    .default([]),
});

const CattleSchema = z.object({
  tagId: z.string().min(1, "Tag ID is required"),
  name: z.string().min(1, "Name is required"),
  breed: z.string().min(1, "Breed is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Gender must be either male or female" }),
  }),
  healthStatus: HealthStatusSchema.optional().default({ status: "healthy" }),
  status: z.enum(["active", "sold", "deceased"]).default("active"),
  purchaseInfo: PurchaseInfoSchema.optional().default({}),
});

const useCattleStore = create((set, get) => ({
  // State
  cattle: [],
  activeCattle: null,
  isLoading: false,
  error: null,
  validationErrors: null,
  filters: {
    status: "",
    breed: "",
    gender: "",
    healthStatus: "",
  },
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  // Actions
  fetchCattle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const queryParams = new URLSearchParams();

      // Add filters to query params if they exist
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.breed) queryParams.append("breed", filters.breed);
      if (filters.gender) queryParams.append("gender", filters.gender);
      if (filters.healthStatus)
        queryParams.append("healthStatus.status", filters.healthStatus);

      const response = await apiClient.get(`/cattle?${queryParams.toString()}`);
      set({ cattle: response.data.data || response.data, isLoading: false });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch cattle",
        isLoading: false,
      });
    }
  },

  getCattleById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/cattle/${id}`);
      set({
        activeCattle: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch cattle details",
        isLoading: false,
      });
      return null;
    }
  },

  getCattleByTagId: async (tagId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/cattle/tag/${tagId}`);
      set({
        activeCattle: response.data.data || response.data,
        isLoading: false,
      });
      return response.data.data || response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch cattle by tag ID",
        isLoading: false,
      });
      return null;
    }
  },

  validateCattleData: (cattleData) => {
    try {
      // Validate and parse the data
      const validData = CattleSchema.parse(cattleData);
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

  createCattle: async (cattleData) => {
    // Validate the data first
    const validation = get().validateCattleData(cattleData);

    if (!validation.valid) {
      set({
        error: "Validation failed. Please check the form.",
        isLoading: false,
      });
      return { success: false, errors: validation.errors };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/cattle", validation.data);
      const newCattle = response.data.data || response.data;

      set((state) => ({
        cattle: [...state.cattle, newCattle],
        isLoading: false,
        validationErrors: null,
      }));

      return { success: true, data: newCattle };
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create cattle",
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateCattle: async (id, cattleData) => {
    // Partial validation for updates
    const validation = get().validateCattleData({
      ...get().activeCattle,
      ...cattleData,
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
      const response = await apiClient.put(`/cattle/${id}`, cattleData);
      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) => (c._id === id ? updatedCattle : c)),
        activeCattle: updatedCattle,
        isLoading: false,
        validationErrors: null,
      }));

      return { success: true, data: updatedCattle };
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update cattle",
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteCattle: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/cattle/${id}`);

      set((state) => ({
        cattle: state.cattle.filter((c) => c._id !== id),
        activeCattle:
          state.activeCattle?._id === id ? null : state.activeCattle,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete cattle",
        isLoading: false,
      });
      return false;
    }
  },

  // Health management
  updateHealthStatus: async (id, healthStatusValue) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/cattle/${id}/health-status`, {
        status: healthStatusValue,
      });

      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) => (c._id === id ? updatedCattle : c)),
        activeCattle: updatedCattle,
        isLoading: false,
      }));

      return updatedCattle;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update health status",
        isLoading: false,
      });
      return null;
    }
  },

  addVaccination: async (id, vaccination) => {
    try {
      // Validate vaccination data
      const validationSchema = z.object({
        name: z.string().min(1, "Vaccination name is required"),
        date: z.string().min(1, "Date is required"),
      });

      validationSchema.parse(vaccination);
      set({ isLoading: true, error: null });

      const response = await apiClient.post(
        `/cattle/${id}/vaccinations`,
        vaccination
      );

      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) => (c._id === id ? updatedCattle : c)),
        activeCattle: updatedCattle,
        isLoading: false,
      }));

      return { success: true, data: updatedCattle };
    } catch (error) {
      let errorMessage = "Failed to add vaccination";

      if (error instanceof z.ZodError) {
        const formattedErrors = {};
        error.errors.forEach((err) => {
          formattedErrors[err.path.join(".")] = err.message;
        });

        set({ validationErrors: formattedErrors, isLoading: false });
        return { success: false, errors: formattedErrors };
      }

      set({
        error: error.response?.data?.message || error.message || errorMessage,
        isLoading: false,
      });

      return { success: false, error: error.message };
    }
  },

  removeVaccination: async (cattleId, vaccinationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.delete(
        `/cattle/${cattleId}/vaccinations/${vaccinationId}`
      );

      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) =>
          c._id === cattleId ? updatedCattle : c
        ),
        activeCattle: updatedCattle,
        isLoading: false,
      }));

      return updatedCattle;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to remove vaccination",
        isLoading: false,
      });
      return null;
    }
  },

  addMedicalRecord: async (id, record) => {
    try {
      // Validate medical record data
      const validationSchema = z.object({
        condition: z.string().min(1, "Condition is required"),
        treatment: z.string().optional(),
        date: z.string().min(1, "Date is required"),
      });

      validationSchema.parse(record);
      set({ isLoading: true, error: null });

      const response = await apiClient.post(
        `/cattle/${id}/medical-records`,
        record
      );

      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) => (c._id === id ? updatedCattle : c)),
        activeCattle: updatedCattle,
        isLoading: false,
      }));

      return { success: true, data: updatedCattle };
    } catch (error) {
      let errorMessage = "Failed to add medical record";

      if (error instanceof z.ZodError) {
        const formattedErrors = {};
        error.errors.forEach((err) => {
          formattedErrors[err.path.join(".")] = err.message;
        });

        set({ validationErrors: formattedErrors, isLoading: false });
        return { success: false, errors: formattedErrors };
      }

      set({
        error: error.response?.data?.message || error.message || errorMessage,
        isLoading: false,
      });

      return { success: false, error: error.message };
    }
  },

  removeMedicalRecord: async (cattleId, recordId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.delete(
        `/cattle/${cattleId}/medical-records/${recordId}`
      );

      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) =>
          c._id === cattleId ? updatedCattle : c
        ),
        activeCattle: updatedCattle,
        isLoading: false,
      }));

      return updatedCattle;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to remove medical record",
        isLoading: false,
      });
      return null;
    }
  },

  // Status management
  changeCattleStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/cattle/${id}/status`, { status });

      const updatedCattle = response.data.data || response.data;

      set((state) => ({
        cattle: state.cattle.map((c) => (c._id === id ? updatedCattle : c)),
        activeCattle: updatedCattle,
        isLoading: false,
      }));

      return updatedCattle;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to change cattle status",
        isLoading: false,
      });
      return null;
    }
  },

  // Filter management
  setFilter: (filterName, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [filterName]: value,
      },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        status: "",
        breed: "",
        gender: "",
        healthStatus: "",
      },
    });
  },

  // Helper functions
  getBreedOptions: () => {
    const state = get();
    const allBreeds = state.cattle.map(c => c.breed).filter(breed => breed);
    
    // Create a unique set of breeds
    const uniqueBreeds = [...new Set(allBreeds)];
    
    // Process breeds to handle different formats
    const formattedBreeds = uniqueBreeds.map(breed => {
      // If breed is already an object with value and label, return it as is
      if (typeof breed === 'object' && breed !== null && breed.value !== undefined && breed.label !== undefined) {
        return breed;
      }
      
      // If it's a string, return it as is
      if (typeof breed === 'string') {
        return breed;
      }
      
      // If it's an object without proper value/label properties, try to convert it
      if (typeof breed === 'object' && breed !== null) {
        if (breed.name) return breed.name;
        if (breed.toString) return breed.toString();
      }
      
      // Fallback
      return String(breed);
    });
    
    // Filter out any undefined/null values
    return formattedBreeds.filter(Boolean);
  },

  getHealthStatusOptions: () => {
    return [
      { value: "healthy", label: "Healthy" },
      { value: "sick", label: "Sick" },
      { value: "quarantined", label: "Quarantined" },
      { value: "pregnant", label: "Pregnant" },
    ];
  },

  getFormattedHealthStatus: (status) => {
    // Capitalize first letter of health status
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  },

  getStatusOptions: () => {
    return [
      { value: "active", label: "Active" },
      { value: "sold", label: "Sold" },
      { value: "deceased", label: "Deceased" },
    ];
  },

  getGenderOptions: () => {
    return [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ];
  },

  clearActiveCattle: () => {
    set({ activeCattle: null });
  },

  resetError: () => {
    set({ error: null });
  },

  clearValidationErrors: () => {
    set({ validationErrors: null });
  },
}));

export default useCattleStore;
