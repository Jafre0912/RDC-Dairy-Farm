import { create } from "zustand";
import apiClient from "../config/axiosConfig";

const useFinanceStore = create((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get("/finance/transactions", {
        params: { startDate, endDate },
      });
      set({ transactions: response.data.data });
    } catch (error) {
      set({ error: error.response?.data?.error || "Failed to fetch transactions" });
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transactionData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Format the data before sending
      const formattedData = {
        ...transactionData,
        amount: Number(transactionData.amount),
        date: new Date(transactionData.date).toISOString(),
      };

      const response = await apiClient.post("/finance/transactions", formattedData);
      
      // Update the transactions list with the new transaction
      set((state) => ({
        transactions: [response.data.data, ...state.transactions],
      }));
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to add transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  updateTransaction: async (id, transactionData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Format the data before sending
      const formattedData = {
        ...transactionData,
        amount: Number(transactionData.amount),
        date: new Date(transactionData.date).toISOString(),
      };

      const response = await apiClient.put(`/finance/transactions/${id}`, formattedData);
      
      // Update the transactions list with the updated transaction
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t._id === id ? response.data.data : t
        ),
      }));
      
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to update transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.delete(`/finance/transactions/${id}`);
      
      // Remove the deleted transaction from the list
      set((state) => ({
        transactions: state.transactions.filter((t) => t._id !== id),
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to delete transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  getTransactionSummary: async (startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get("/finance/summary", {
        params: { startDate, endDate },
      });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to fetch transaction summary";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  // Helper functions for calculations
  calculateSummary: () => {
    const { transactions } = get();
    return {
      totalIncome: transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
      netBalance:
        transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0) -
        transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
      transactionCount: transactions.length,
      incomeCount: transactions.filter((t) => t.type === "income").length,
      expenseCount: transactions.filter((t) => t.type === "expense").length,
    };
  },
}));

export default useFinanceStore; 