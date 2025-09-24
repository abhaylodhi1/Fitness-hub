// store/useFitnessStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useFitnessStore = create(
  persist(
    (set, get) => ({
      // User profile data
      profile: null,
      
      // Calculation results
      calculations: [],
      
      // Current goals
      goals: [
        { id: 1, title: "Daily Steps", current: 8432, target: 10000, icon: "running", unit: "" },
        { id: 2, title: "Water Intake", current: 1.8, target: 3, icon: "apple", unit: "L" },
        { id: 3, title: "Workouts", current: 3, target: 5, icon: "dumbbell", unit: "" },
      ],
      
      // Recent activities
      activities: [],
      
      // Add a new calculation
      addCalculation: (calculation) => {
        const newCalculation = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...calculation
        };
        
        set((state) => ({
          calculations: [newCalculation, ...state.calculations.slice(0, 4)] // Keep only 5 most recent
        }));
        
        return newCalculation;
      },
      
      // Update goals
      updateGoals: (newGoals) => {
        set({ goals: newGoals });
      },
      
      // Add activity
      addActivity: (activity) => {
        const newActivity = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...activity
        };
        
        set((state) => ({
          activities: [newActivity, ...state.activities.slice(0, 4)] // Keep only 5 most recent
        }));
      },
      
      // Clear all data
      clearData: () => {
        set({ profile: null, calculations: [], activities: [] });
      }
    }),
    {
      name: "fitness-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);