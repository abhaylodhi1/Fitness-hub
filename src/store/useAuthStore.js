// store/useAuthStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
});

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      // SIGNUP
      signup: async ({ name, email, password }) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/signup", { name, email, password });
          
          if (res.data.user && res.data.token) {
            set({ 
              user: res.data.user, 
              token: res.data.token,
              isLoading: false 
            });
          }
          
          return { 
            success: true, 
            message: res.data.message,
            user: res.data.user 
          };
        } catch (err) {
          set({ isLoading: false });
          return {
            success: false,
            message: err.response?.data?.message || "Signup failed",
          };
        }
      },

      // LOGIN
      login: async ({ email, password }) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/login", { email, password });
          
          set({ 
            user: res.data.user, 
            token: res.data.token,
            isLoading: false 
          });
          
          return { 
            success: true, 
            message: res.data.message,
            user: res.data.user 
          };
        } catch (err) {
          set({ isLoading: false });
          return {
            success: false,
            message: err.response?.data?.message || "Login failed",
          };
        }
      },

      // LOGOUT
      logout: async () => {
        try {
          await api.post("/logout");
          set({ user: null, token: null });
        } catch (err) {
          console.error("Logout failed", err);
          // Still clear local state even if server logout fails
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);