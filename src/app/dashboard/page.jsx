"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useFitnessStore } from "@/store/useFitnessStore";
import { useRouter } from "next/navigation";
import { FaFire, FaAppleAlt, FaDumbbell, FaHeart, FaRunning, FaArrowRight, FaCalculator, FaPlus, FaEdit, FaTrash, FaUtensils, FaLightbulb, FaWater, FaChartLine } from "react-icons/fa";
import { GiFruitBowl, GiMeal } from "react-icons/gi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// Helper function to ensure values are numbers
const ensureNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { calculations, goals, activities, updateGoals, addActivity } = useFitnessStore();
  const router = useRouter();
  const [weeklyData, setWeeklyData] = useState([]);
  const [nutritionData, setNutritionData] = useState([]);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'nutrition', 'progress'

  // Get the latest calculation if available
  const latestCalculation = calculations.length > 0 ? calculations[0] : null;

  // Sample AI Tips and Diet Plan (would come from your calculator data)
  const aiTips = latestCalculation?.aiTips || [
    "Focus on protein-rich foods to support muscle maintenance",
    "Incorporate strength training 3 times per week",
    "Stay hydrated by drinking at least 8 glasses of water daily",
    "Get 7-9 hours of quality sleep each night",
    "Consider consulting a nutritionist for personalized advice"
  ];

  const dietPlan = latestCalculation?.dietPlan || [
    { name: "Breakfast", time: "8:00 AM", items: "Oatmeal with berries and nuts", calories: "350 kcal" },
    { name: "Lunch", time: "12:30 PM", items: "Grilled chicken salad with quinoa", calories: "450 kcal" },
    { name: "Snack", time: "3:30 PM", items: "Greek yogurt with honey", calories: "200 kcal" },
    { name: "Dinner", time: "7:00 PM", items: "Baked salmon with roasted vegetables", calories: "500 kcal" }
  ];

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      setIsLoading(true);
      
      // Generate weekly data based on the latest calculation if available
      const baseCalories = latestCalculation ? ensureNumber(latestCalculation.adjustedCalories) : 2200;
      
      // Ensure all values are numbers to prevent NaN errors
      const safeWeeklyData = [
        { day: 'Mon', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
        { day: 'Tue', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
        { day: 'Wed', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
        { day: 'Thu', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
        { day: 'Fri', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
        { day: 'Sat', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
        { day: 'Sun', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
      ];
      
      setWeeklyData(safeWeeklyData);
      
      // Set nutrition data based on latest calculation or defaults
      if (latestCalculation) {
        setNutritionData([
          { name: 'Protein', value: ensureNumber(latestCalculation.protein) },
          { name: 'Carbs', value: ensureNumber(latestCalculation.carbs) },
          { name: 'Fat', value: ensureNumber(latestCalculation.fats) },
        ]);
      } else {
        setNutritionData([
          { name: 'Protein', value: 30 },
          { name: 'Carbs', value: 50 },
          { name: 'Fat', value: 20 },
        ]);
      }
      
      setIsLoading(false);
    };
    
    loadUserData();
  }, [latestCalculation]);

  const handleCalculateClick = () => {
    router.push("/calculator");
  };

  const handleGoalUpdate = (id, field, value) => {
    // Ensure the value is a valid number
    const numericValue = ensureNumber(value);
    
    const updatedGoals = goals.map(goal => {
      if (goal.id === id) {
        return { ...goal, [field]: numericValue };
      }
      return goal;
    });
    updateGoals(updatedGoals);
  };

  const handleAddManualActivity = () => {
    const newActivity = {
      activity: "Manual Activity",
      time: new Date().toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      duration: "30 min",
      calories: "250 cal"
    };
    addActivity(newActivity);
  };

  const handleDeleteCalculation = (id) => {
    const updatedCalculations = calculations.filter(calc => calc.id !== id);
    // Update localStorage directly (temporary fix)
    const currentStorage = JSON.parse(localStorage.getItem('fitness-storage') || '{}');
    currentStorage.state.calculations = updatedCalculations;
    localStorage.setItem('fitness-storage', JSON.stringify(currentStorage));
    window.location.reload();
  };

  const getIconComponent = (iconName) => {
    switch(iconName) {
      case "running": return <FaRunning className="text-blue-500" />;
      case "apple": return <FaAppleAlt className="text-blue-300" />;
      case "dumbbell": return <FaDumbbell className="text-red-500" />;
      default: return <FaHeart className="text-green-600" />;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </main>
       
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-black bg-gradient-to-br from-gray-50 to-blue-50">
     

      <main className="flex-grow p-4 md:p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto"
        >
          {/* Welcome Section with latest goal */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            {user ? (
              <div>
                <p className="mt-2 text-gray-600">
                  Welcome back, <span className="font-semibold text-indigo-600">{user.name}</span>! Here's your fitness overview.
                </p>
                {latestCalculation && (
                  <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                      Current goal: <span className="font-semibold capitalize">{latestCalculation.goal} weight</span> 
                      ({ensureNumber(latestCalculation.adjustedCalories)} kcal/day)
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      BMI: <span className="font-semibold">{ensureNumber(latestCalculation.bmi)}</span> ({latestCalculation.bmiCategory}) • 
                      Ideal Weight: <span className="font-semibold">{ensureNumber(latestCalculation.idealWeight)} kg</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-red-500">You are not logged in.</p>
            )}
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'overview' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-indigo-700'
                }`}
              >
                <FaChartLine className="mr-2" /> Overview
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'nutrition' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-indigo-700'
                }`}
              >
                <GiFruitBowl className="mr-2" /> Nutrition
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'progress' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-indigo-700'
                }`}
              >
                <FaRunning className="mr-2" /> Progress
              </button>
            </div>
          </motion.div>

          {/* Quick Stats - Use data from latest calculation */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FaFire className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Daily Calories</p>
                <p className="text-2xl font-bold">
                  {latestCalculation ? ensureNumber(latestCalculation.adjustedCalories) : "2,243"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <FaHeart className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">BMI</p>
                <p className="text-2xl font-bold">
                  {latestCalculation ? ensureNumber(latestCalculation.bmi) : "22.5"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-purple-100 rounded-full mr-4">
                <FaRunning className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Goal</p>
                <p className="text-2xl font-bold capitalize">
                  {latestCalculation ? latestCalculation.goal : "maintain"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-lg flex items-center border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-orange-100 rounded-full mr-4">
                <FaDumbbell className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Ideal Weight</p>
                <p className="text-2xl font-bold">
                  {latestCalculation ? `${ensureNumber(latestCalculation.idealWeight)} kg` : "68 kg"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">Calculate Your Fitness Needs</h2>
                  <p className="opacity-90">Get personalized calorie and nutrition recommendations</p>
                </div>
                <button 
                  onClick={handleCalculateClick}
                  className="flex items-center gap-2 bg-white text-indigo-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all shadow-md transform hover:scale-105"
                >
                  <FaCalculator /> Calculate Now
                </button>
              </div>
            </div>
          </motion.div>

          {/* AI Health Tips */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" /> Personalized Health Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiTips.map((tip, i) => (
                <motion.div 
                  key={i} 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <p className="text-gray-800">{tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Diet Plan Section */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <GiMeal className="text-amber-600" /> Recommended Daily Diet Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dietPlan.map((meal, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  whileHover={{ y: -3 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-indigo-800">{meal.name}</h3>
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      {meal.time}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{meal.items}</p>
                  <p className="text-sm text-gray-500">{meal.calories}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Charts Section - Using data from store */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Activity Chart */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaRunning className="text-blue-500" /> Weekly Activity
                </h2>
                <button 
                  onClick={() => {
                    const baseCalories = latestCalculation ? ensureNumber(latestCalculation.adjustedCalories) : 2200;
                    setWeeklyData([
                      { day: 'Mon', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                      { day: 'Tue', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                      { day: 'Wed', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                      { day: 'Thu', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                      { day: 'Fri', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                      { day: 'Sat', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                      { day: 'Sun', calories: ensureNumber(Math.floor(Math.random() * 500) + baseCalories - 250), steps: ensureNumber(Math.floor(Math.random() * 3000) + 7000) },
                    ]);
                  }}
                  className="text-sm text-indigo-600 hover:underline flex items-center"
                >
                  <FaRefresh className="mr-1" /> Refresh
                </button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="calories" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      activeDot={{ r: 8, fill: "#8884d8" }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="steps" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      activeDot={{ r: 8, fill: "#82ca9d" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#8884d8] rounded-full mr-2"></div>
                  <span className="text-sm">Calories</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#82ca9d] rounded-full mr-2"></div>
                  <span className="text-sm">Steps</span>
                </div>
              </div>
            </motion.div>

            {/* Nutrition Chart */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <GiFruitBowl className="text-green-600" /> Nutrition Breakdown
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nutritionData.map(item => ({
                        ...item,
                        value: ensureNumber(item.value)
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {nutritionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${ensureNumber(value)}g`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="font-semibold text-[#0088FE]">{ensureNumber(nutritionData[0]?.value || 0)}g</p>
                  <p className="text-sm text-gray-600">Protein</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#00C49F]">{ensureNumber(nutritionData[1]?.value || 0)}g</p>
                  <p className="text-sm text-gray-600">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#FFBB28]">{ensureNumber(nutritionData[2]?.value || 0)}g</p>
                  <p className="text-sm text-gray-600">Fat</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Goals Progress */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Your Goals Progress</h2>
              <button 
                onClick={() => setIsEditingGoals(!isEditingGoals)}
                className="flex items-center gap-1 text-indigo-600 hover:underline"
              >
                <FaEdit className="text-sm" /> {isEditingGoals ? 'Save Changes' : 'Edit Goals'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goals.map((goal) => {
                const current = ensureNumber(goal.current);
                const target = ensureNumber(goal.target);
                const progress = target > 0 ? (current / target) * 100 : 0;
                
                return (
                  <motion.div 
                    key={goal.id} 
                    className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        {getIconComponent(goal.icon)}
                      </div>
                      <h3 className="font-semibold">{goal.title}</h3>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      {isEditingGoals ? (
                        <>
                          <input
                            type="number"
                            value={current}
                            onChange={(e) => handleGoalUpdate(goal.id, 'current', e.target.value)}
                            className="w-16 p-1 border rounded text-center"
                            min="0"
                          />
                          <span className="self-center">/</span>
                          <input
                            type="number"
                            value={target}
                            onChange={(e) => handleGoalUpdate(goal.id, 'target', e.target.value)}
                            className="w-16 p-1 border rounded text-center"
                            min="1"
                          />
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{current}{goal.unit || ''}</span>
                          <span className="text-gray-500">{target}{goal.unit || ''}</span>
                        </>
                      )}
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-xs font-medium text-indigo-600">
                        {progress.toFixed(0)}% Complete
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
              <button 
                onClick={handleAddManualActivity}
                className="flex items-center gap-1 text-indigo-600 hover:underline"
              >
                <FaPlus className="text-sm" /> Add Activity
              </button>
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <motion.div 
                    key={activity.id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <FaRunning className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.activity}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{activity.duration}</p>
                      <p className="text-sm text-gray-500">{activity.calories}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaCalculator className="text-4xl mx-auto mb-4 text-gray-400" />
                  <p>No recent activities. Create your first fitness calculation!</p>
                  <button 
                    onClick={() => router.push("/calculator")}
                    className="mt-4 text-indigo-600 hover:underline font-medium"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
            {activities.length > 0 && (
              <button className="mt-4 flex items-center text-indigo-600 font-medium hover:underline">
                View all activities <FaArrowRight className="ml-1" />
              </button>
            )}
          </motion.div>

          {/* Recent Calculations */}
          {calculations.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Calculations</h2>
                <span className="text-sm text-gray-500">{calculations.length} saved</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculations.slice(0, 3).map((calc) => (
                  <motion.div 
                    key={calc.id} 
                    className="border rounded-xl p-4 relative bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                    whileHover={{ y: -3 }}
                  >
                    <button 
                      onClick={() => handleDeleteCalculation(calc.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete calculation"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold capitalize text-indigo-800">{calc.goal} Weight</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(calc.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full capitalize">
                        {calc.goal}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Calories:</span>
                        <span className="text-sm font-semibold text-indigo-700">{ensureNumber(calc.adjustedCalories)} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">BMI:</span>
                        <span className="text-sm font-semibold text-indigo-700">{ensureNumber(calc.bmi)} ({calc.bmiCategory})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Ideal Weight:</span>
                        <span className="text-sm font-semibold text-indigo-700">{ensureNumber(calc.idealWeight)} kg</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {calculations.length > 3 && (
                <button className="mt-4 flex items-center text-indigo-600 font-medium hover:underline">
                  View all calculations <FaArrowRight className="ml-1" />
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

     
    </div>
  );
}

// Refresh icon component
const FaRefresh = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
  </svg>
);