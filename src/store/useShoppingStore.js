// store/useShoppingStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
          const parsedAuth = JSON.parse(authData);
          if (parsedAuth.state?.token) {
            config.headers.Authorization = `Bearer ${parsedAuth.state.token}`;
          }
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 errors (unauthorized), not 404 (not found)
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const useShoppingStore = create(
  persist(
    (set, get) => ({
      // ... rest of your store implementation remains the same
      // Cart items
      cart: [],
      
      // Products
      products: [],
      
      // Loading states
      isLoading: false,
      
      // Error state
      error: null,

      // Fetch products from API
      fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.get("/products");
          set({ products: res.data.products, isLoading: false });
          return { success: true, products: res.data.products };
        } catch (err) {
          const errorMessage = err.response?.data?.message || "Failed to fetch products";
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      // Add to cart
      addToCart: async (productId, quantity = 1) => {
        try {
          const res = await api.post("/cart/add", { productId, quantity });
          set({ cart: res.data.cart?.items || [] });
          return { success: true, cart: res.data.cart?.items || [] };
        } catch (err) {
          // Don't redirect for 404 errors (API endpoint not found)
          if (err.response?.status === 404) {
            console.error("Cart API endpoint not found");
            return { 
              success: false, 
              message: "Cart functionality not available. Please check if the API endpoint exists." 
            };
          }
          
          const errorMessage = err.response?.data?.message || "Failed to add to cart";
          return { success: false, message: errorMessage };
        }
      },

      // Remove from cart
      removeFromCart: async (productId) => {
        try {
          const res = await api.delete(`/cart/remove/${productId}`);
          set({ cart: res.data.cart?.items || [] });
          return { success: true, cart: res.data.cart?.items || [] };
        } catch (err) {
          const errorMessage = err.response?.data?.message || "Failed to remove from cart";
          return { success: false, message: errorMessage };
        }
      },

      // Update cart item quantity
      updateCartQuantity: async (productId, quantity) => {
        try {
          const res = await api.put(`/cart/update/${productId}`, { quantity });
          set({ cart: res.data.cart?.items || [] });
          return { success: true, cart: res.data.cart?.items || [] };
        } catch (err) {
          const errorMessage = err.response?.data?.message || "Failed to update cart";
          return { success: false, message: errorMessage };
        }
      },

      // Fetch user cart
      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.get("/cart");
          set({ cart: res.data.cart?.items || [], isLoading: false });
          return { success: true, cart: res.data.cart?.items || [] };
        } catch (err) {
          const errorMessage = err.response?.data?.message || "Failed to fetch cart";
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      // In your useShoppingStore.js, add this method:
// In your useShoppingStore.js, add this method:
// Add this to your shopping store to track checkout state
// In your useShoppingStore.js, add this state:
isCheckingOut: false,

// And update the checkout method:
checkout: async (orderData) => {
  set({ isCheckingOut: true });
  try {
    const res = await api.post("/orders/create", orderData);
    
    if (res.data.success) {
      // Clear local cart only after successful order creation
      set({ cart: [], isCheckingOut: false });
      
      return { 
        success: true, 
        orderId: res.data.orderId,
        message: res.data.message 
      };
    } else {
      set({ isCheckingOut: false });
      return { 
        success: false, 
        message: res.data.message || "Checkout failed" 
      };
    }
  } catch (err) {
    set({ isCheckingOut: false });
    const errorMessage = err.response?.data?.message || "Checkout failed";
    console.error("Checkout error:", err);
    return { success: false, message: errorMessage };
  }
},

      // Clear cart (local only - for checkout success)
      clearCart: () => {
        set({ cart: [] });
      },

      // Clear cart from server
      clearServerCart: async () => {
        try {
          await api.delete("/cart/clear");
          set({ cart: [] });
          return { success: true };
        } catch (err) {
          const errorMessage = err.response?.data?.message || "Failed to clear cart";
          return { success: false, message: errorMessage };
        }
      },
    }),
    {
      name: "shopping-storage",
      storage: createJSONStorage(() => {
        // Handle SSR by returning a mock storage
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({ 
        cart: state.cart,
        products: state.products
      }),
    }
  )
);