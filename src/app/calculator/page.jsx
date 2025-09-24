"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { FaAppleAlt, FaDumbbell, FaFire, FaWeight, FaHeart, FaRunning, FaClock, FaUtensils, FaSave, FaHistory } from "react-icons/fa";
import { GiMeal, GiFruitBowl, GiChickenLeg } from "react-icons/gi";
import { IoIosWater } from "react-icons/io";
import axios from "axios";
import { useFitnessStore } from "@/store/useFitnessStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function FitnessCalculator() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState("sedentary");
  const [dietPreference, setDietPreference] = useState("balanced");
  const [goal, setGoal] = useState("maintain");
  const [result, setResult] = useState(null);
  const [aiTips, setAiTips] = useState([]);
  const [dietPlan, setDietPlan] = useState([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previousCalculations, setPreviousCalculations] = useState([]);
  
  // Get the addCalculation function from our store
  const { addCalculation, addActivity, calculations } = useFitnessStore();
  const { user } = useAuthStore();

  const activityMultiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Load previous calculations on component mount
  useEffect(() => {
    if (calculations && calculations.length > 0) {
      setPreviousCalculations(calculations.slice(0, 3)); // Show only 3 most recent
    }
  }, [calculations]);

  const convertHeightToCm = () => {
    if (heightUnit === "cm") return Number(height);
    if (heightUnit === "inches") return Number(height) * 2.54;
    if (heightUnit === "feet") return Number(feet) * 30.48 + Number(inches) * 2.54;
    return 0;
  };

  const calculateBMI = (w, h) => {
    return (w / ((h / 100) ** 2)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi >= 18.5 && bmi < 25) return "Normal weight";
    if (bmi >= 25 && bmi < 30) return "Overweight";
    return "Obese";
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    const heightCm = convertHeightToCm();
    if (!weight || !heightCm || !age) return;

    let bmr;
    if (gender === "male") {
      bmr = 88.36 + 13.4 * weight + 4.8 * heightCm - 5.7 * age;
    } else {
      bmr = 447.6 + 9.2 * weight + 3.1 * heightCm - 4.3 * age;
    }

    const dailyCalories = Math.round(bmr * activityMultiplier[activity]);
    const bmi = calculateBMI(weight, heightCm);
    const bmiCategory = getBMICategory(bmi);
    const idealWeight =
      gender === "male"
        ? (22 * (heightCm / 100) ** 2).toFixed(1)
        : (21 * (heightCm / 100) ** 2).toFixed(1);

    // Adjust calories based on goal
    let adjustedCalories = dailyCalories;
    if (goal === "lose") adjustedCalories = dailyCalories - 500;
    if (goal === "gain") adjustedCalories = dailyCalories + 500;

    const chartData = [
      { activity: "Sedentary", calories: Math.round(bmr * activityMultiplier.sedentary) },
      { activity: "Light", calories: Math.round(bmr * activityMultiplier.light) },
      { activity: "Moderate", calories: Math.round(bmr * activityMultiplier.moderate) },
      { activity: "Active", calories: Math.round(bmr * activityMultiplier.active) },
      { activity: "Very Active", calories: Math.round(bmr * activityMultiplier.veryActive) },
    ];

    // Macronutrient breakdown (approximate)
    const protein = Math.round((adjustedCalories * 0.3) / 4);
    const carbs = Math.round((adjustedCalories * 0.5) / 4);
    const fats = Math.round((adjustedCalories * 0.2) / 9);

    const macroData = [
      { name: "Protein", value: protein, color: "#0088FE" },
      { name: "Carbs", value: carbs, color: "#00C49F" },
      { name: "Fats", value: fats, color: "#FF8042" }
    ];

    const calculationResult = {
      dailyCalories,
      adjustedCalories,
      bmi,
      bmiCategory,
      idealWeight,
      weightLoss: dailyCalories - 500,
      weightGain: dailyCalories + 500,
      protein,
      carbs,
      fats,
      goal,
      dietPreference,
      timestamp: new Date().toISOString()
    };

    setResult(calculationResult);
    setSaved(false); // Reset saved state when new calculation is made

    // Fetch AI-generated diet and tips
    setLoadingTips(true);
    setLoadingDiet(true);
    try {
      const res = await axios.post("/api/ai-tips", {
        weight,
        height: heightCm,
        age,
        gender,
        activity,
        bmi,
        dietPreference,
        goal
      });
      setAiTips(res.data.tips);
      
      // Parse diet plan if available
      if (res.data.dietPlan) {
        setDietPlan(res.data.dietPlan);
      }
    } catch (err) {
      setAiTips(["Could not fetch AI tips. Please try again later."]);
      console.error("Error fetching AI tips:", err);
    } finally {
      setLoadingTips(false);
      setLoadingDiet(false);
    }
  };

  const handleSaveToDashboard = () => {
    if (!result) return;
    
    // Save the calculation to our store
    addCalculation(result);
    
    // Also add a new activity for the calculation
    addActivity({
      activity: "Fitness Calculation",
      time: new Date().toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      duration: "Calculation",
      calories: `${result.adjustedCalories} kcal goal`
    });
    
    setSaved(true);
    
    // Reset saved status after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  const loadPreviousCalculation = (calculation) => {
    setResult(calculation);
    setGoal(calculation.goal);
    setDietPreference(calculation.dietPreference || "balanced");
    setSaved(true); // Mark as already saved
  };

  // Sample water intake data
  const waterIntakeData = [
    { time: "6 AM", amount: 500 },
    { time: "9 AM", amount: 500 },
    { time: "12 PM", amount: 500 },
    { time: "3 PM", amount: 500 },
    { time: "6 PM", amount: 500 },
    { time: "9 PM", amount: 500 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 text-gray-800 flex flex-col items-center p-4 md:p-6">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold mb-2 text-center text-gray-800">Fitness & Nutrition Dashboard</h1>
        <p className="text-center text-gray-600 mb-8">Your personalized health and wellness assistant</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleCalculate}
              className="bg-white p-6 rounded-2xl shadow-xl w-full flex flex-col gap-5 sticky top-6"
            >
              <h2 className="text-2xl font-bold mb-2 text-green-700 flex items-center gap-2">
                <FaHeart className="text-red-500" /> Personal Details
              </h2>
              
              {/* Display user info if logged in */}
              {user && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    Logged in as: <span className="font-semibold">{user.name}</span>
                  </p>
                </div>
              )}
              
              {/* Weight */}
              <div>
                <label className="mb-1 font-semibold flex items-center gap-2">
                  <FaWeight className="text-gray-600" /> Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter weight in kg"
                  required
                  min="1"
                  max="300"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block mb-1 font-semibold">Height</label>
                <div className="flex gap-2">
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cm">cm</option>
                    <option value="inches">inches</option>
                    <option value="feet">feet/inches</option>
                  </select>

                  {heightUnit === "feet" ? (
                    <div className="flex gap-2 w-full">
                      <input
                        type="number"
                        value={feet}
                        onChange={(e) => setFeet(e.target.value)}
                        className="w-1/2 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Feet"
                        required
                        min="1"
                        max="8"
                      />
                      <input
                        type="number"
                        value={inches}
                        onChange={(e) => setInches(e.target.value)}
                        className="w-1/2 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Inches"
                        required
                        min="0"
                        max="11"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={`Enter height in ${heightUnit}`}
                      required
                      min="1"
                      max={heightUnit === "cm" ? "300" : "120"}
                    />
                  )}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block mb-1 font-semibold">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter age"
                  required
                  min="1"
                  max="120"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block mb-1 font-semibold">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Activity Level */}
              <div>
                <label className="mb-1 font-semibold flex items-center gap-2">
                  <FaRunning className="text-blue-500" /> Activity Level
                </label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="light">Lightly active</option>
                  <option value="moderate">Moderately active</option>
                  <option value="active">Active</option>
                  <option value="veryActive">Very active</option>
                </select>
              </div>

              {/* Diet Preference */}
              <div>
                <label className="mb-1 font-semibold flex items-center gap-2">
                  <GiChickenLeg className="text-orange-500" /> Diet Preference
                </label>
                <select
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="balanced">Balanced</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="lowCarb">Low Carb</option>
                  <option value="highProtein">High Protein</option>
                </select>
              </div>

              {/* Goal */}
              <div>
                <label className="block mb-1 font-semibold">Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-green-600 to-cyan-600 text-white py-3 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-cyan-700 transition-all shadow-md"
              >
                Calculate & Generate Plan
              </button>
            </form>

            {/* Previous Calculations */}
            {previousCalculations.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FaHistory className="text-gray-600" /> Previous Calculations
                </h3>
                <div className="space-y-3">
                  {previousCalculations.map((calc, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => loadPreviousCalculation(calc)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium capitalize">{calc.goal} Weight</p>
                          <p className="text-sm text-gray-500">
                            {new Date(calc.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {calc.adjustedCalories} kcal
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {result && (
              <div className="flex flex-col gap-6">
                {/* Save to Dashboard Button */}
                <div className="bg-white p-4 rounded-2xl shadow-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Save to Dashboard</h3>
                    <p className="text-sm text-gray-600">Store this calculation for future reference</p>
                  </div>
                  <button
                    onClick={handleSaveToDashboard}
                    disabled={saved}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      saved 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                  >
                    <FaSave /> {saved ? "Saved!" : "Save to Dashboard"}
                  </button>
                </div>
                
                {/* Stats Overview */}
                <div className="bg-white p-6 rounded-2xl shadow-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <div className="p-3 bg-green-100 rounded-full">
                      <FaWeight className="text-2xl text-green-600" />
                    </div>
                    <p className="font-semibold">BMI</p>
                    <p className="text-2xl font-bold">{result.bmi}</p>
                    <p className="text-sm text-gray-600">{result.bmiCategory}</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FaAppleAlt className="text-2xl text-blue-600" />
                    </div>
                    <p className="font-semibold">Ideal Weight</p>
                    <p className="text-2xl font-bold">{result.idealWeight} kg</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <FaFire className="text-2xl text-orange-600" />
                    </div>
                    <p className="font-semibold">Daily Calories</p>
                    <p className="text-2xl font-bold">{result.adjustedCalories} kcal</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FaDumbbell className="text-2xl text-purple-600" />
                    </div>
                    <p className="font-semibold">Goal</p>
                    <p className="text-xl font-bold capitalize">{goal}</p>
                    <p className="text-sm text-gray-600">
                      {goal === "lose" ? `${result.weightLoss} kcal` : 
                       goal === "gain" ? `${result.weightGain} kcal` : 
                       `${result.dailyCalories} kcal`}
                    </p>
                  </div>
                </div>

                {/* Macronutrients Section */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <GiFruitBowl className="text-green-600" /> Macronutrient Distribution
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Protein", value: result.protein },
                              { name: "Carbs", value: result.carbs },
                              { name: "Fats", value: result.fats }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#0088FE" />
                            <Cell fill="#00C49F" />
                            <Cell fill="#FF8042" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col justify-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#0088FE]"></div>
                        <div>
                          <p className="font-semibold">Protein: {result.protein}g</p>
                          <p className="text-sm text-gray-600">Builds and repairs tissues</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#00C49F]"></div>
                        <div>
                          <p className="font-semibold">Carbs: {result.carbs}g</p>
                          <p className="text-sm text-gray-600">Primary energy source</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#FF8042]"></div>
                        <div>
                          <p className="font-semibold">Fats: {result.fats}g</p>
                          <p className="text-sm text-gray-600">Energy storage and hormone production</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calories vs Activity Level */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaRunning className="text-blue-500" /> Calories vs Activity Level
                  </h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { activity: "Sedentary", calories: Math.round(result.dailyCalories * 1.2) },
                        { activity: "Light", calories: Math.round(result.dailyCalories * 1.375) },
                        { activity: "Moderate", calories: Math.round(result.dailyCalories * 1.55) },
                        { activity: "Active", calories: Math.round(result.dailyCalories * 1.725) },
                        { activity: "Very Active", calories: Math.round(result.dailyCalories * 1.9) },
                      ]}>
                        <XAxis dataKey="activity" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="calories" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Water Intake Recommendation */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <IoIosWater className="text-blue-400" /> Daily Water Intake
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {waterIntakeData.map((item, index) => (
                      <div key={index} className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                        <p className="font-semibold">{item.time}</p>
                        <div className="flex items-end gap-1 mt-2">
                          <div className="w-6 bg-blue-200 rounded-t-lg" style={{ height: `${item.amount/20}px` }}></div>
                          <p className="text-sm">{item.amount}ml</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-gray-600">Total: 3L (Recommended for your weight)</p>
                </div>

                {/* AI Tips */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaHeart className="text-red-500" /> Personalized Health Tips
                  </h2>
                  {loadingTips ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiTips.map((tip, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                          <p className="text-gray-800">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sample Diet Plan */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <GiMeal className="text-amber-600" /> Sample Daily Diet Plan
                  </h2>
                  {loadingDiet ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : dietPlan.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Meal
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Food Items
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Calories
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dietPlan.map((meal, index) => (
                            <tr key={index}>
                              <td className="px-4 py-4 whitespace-nowrap font-medium">
                                {meal.name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {meal.time}
                              </td>
                              <td className="px-4 py-4">
                                {meal.items}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {meal.calories} kcal
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FaUtensils className="text-4xl mx-auto mb-4 text-gray-400" />
                      <p>Submit your details to generate a personalized diet plan</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {!result && (
          <div className="mt-12 text-center text-gray-600">
            <div className="flex justify-center mb-6">
              <div className="animate-bounce bg-green-100 p-4 w-16 h-16 ring-1 ring-green-500/30 rounded-full">
                <FaHeart className="text-green-600 text-2xl mx-auto" />
              </div>
            </div>
            <p className="text-xl">Enter your details to get personalized fitness and nutrition recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
}