import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { weight, height, age, gender, activity, bmi, dietPreference, goal } = await req.json();

    // Validate required fields
    if (!weight || !height || !age || !gender || !activity || !bmi || !dietPreference || !goal) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          tips: [],
          dietPlan: [] 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "Service configuration error",
          tips: getFallbackTips(goal, dietPreference),
          dietPlan: getFallbackDietPlan(dietPreference)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For free API keys, let's try to use available models and have good fallbacks
    let aiResponse = null;
    
    try {
      // Initialize the Gemini client
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Try different model names that might work with free tier
      const availableModels = [
        "gemini-pro",
        "models/gemini-pro",
        "gemini-1.0-pro",
        "models/gemini-1.0-pro"
      ];
      
      let model;
      let modelError = null;
      
      // Try each model until one works
      for (const modelName of availableModels) {
        try {
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000, // Reduced for free tier
            }
          });
          
          // Test the model with a simple prompt
          const testResult = await model.generateContent("Say 'Hello'");
          const testResponse = await testResult.response;
          console.log(`Model ${modelName} is working`);
          break; // If we get here, the model works
        } catch (err) {
          modelError = err;
          console.log(`Model ${modelName} failed:`, err.message);
          continue; // Try next model
        }
      }
      
      if (!model) {
        throw new Error("No working models found with free API key");
      }

      const prompt = `
Create a personalized fitness and nutrition plan based on this profile:

Weight: ${weight} kg
Height: ${height} cm  
Age: ${age} years
Gender: ${gender}
Activity: ${activity}
BMI: ${bmi}
Diet: ${dietPreference}
Goal: ${goal}

Provide:
1. 5 specific health tips
2. A daily meal plan with 4 meals

Return as JSON:
{
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "dietPlan": [
    {"name": "Breakfast", "time": "8:00 AM", "items": "food", "calories": "XXX kcal"},
    {"name": "Lunch", "time": "12:30 PM", "items": "food", "calories": "XXX kcal"},
    {"name": "Snack", "time": "3:30 PM", "items": "food", "calories": "XXX kcal"},
    {"name": "Dinner", "time": "7:00 PM", "items": "food", "calories": "XXX kcal"}
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the response
      const cleanedText = text.replace(/```json|```/g, '').trim();
      
      try {
        aiResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        // If JSON parsing fails, use extracted tips with fallback diet
        const tips = extractTipsFromText(text);
        aiResponse = {
          tips: tips.length >= 3 ? tips : getFallbackTips(goal, dietPreference),
          dietPlan: getFallbackDietPlan(dietPreference)
        };
      }
      
    } catch (aiError) {
      console.error("AI service unavailable with free API key:", aiError.message);
      // Use comprehensive fallback data
      aiResponse = {
        tips: getFallbackTips(goal, dietPreference),
        dietPlan: getFallbackDietPlan(dietPreference)
      };
    }

    return new Response(JSON.stringify(aiResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General error:", error);
    return new Response(JSON.stringify({ 
      tips: getFallbackTips('maintain', 'balanced'),
      dietPlan: getFallbackDietPlan('balanced')
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Enhanced helper functions with more comprehensive fallbacks
function getBMICategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function extractTipsFromText(text) {
  try {
    const tipMatches = text.match(/(?:\d+\.\s|[-•*]\s)(.+?)(?=\n\d+\.|\n[-•*]|\n\n|$)/g);
    if (tipMatches) {
      return tipMatches.map(tip => tip.replace(/^\d+\.\s|^[-•*]\s/, '').trim()).slice(0, 5);
    }
    return text.split('\n')
      .filter(line => line.trim().length > 20 && !line.includes('{') && !line.includes('}'))
      .slice(0, 5)
      .map(line => line.trim());
  } catch (e) {
    return [];
  }
}

function getFallbackTips(goal, dietPreference) {
  const goalTips = {
    lose: [
      "Aim for a 300-500 calorie deficit daily for sustainable weight loss",
      "Include 30-45 minutes of cardio 4-5 times per week",
      "Focus on lean protein to maintain muscle while losing fat",
      "Drink water before meals to help control appetite",
      "Get 7-8 hours of sleep to support metabolism and recovery"
    ],
    maintain: [
      "Balance your macronutrients: 40% carbs, 30% protein, 30% fat",
      "Mix strength training with cardio for overall fitness",
      "Practice mindful eating and listen to hunger cues",
      "Stay consistent with your meal timing and exercise routine",
      "Include variety in your workouts to prevent plateaus"
    ],
    gain: [
      "Aim for 300-500 calorie surplus with focus on protein",
      "Prioritize compound exercises like squats and deadlifts",
      "Consume protein within 30 minutes after workouts",
      "Eat every 3-4 hours to maintain positive nitrogen balance",
      "Track your progress and adjust calories as needed"
    ]
  };

  return goalTips[goal] || goalTips.maintain;
}

function getFallbackDietPlan(dietPreference) {
  const dietPlans = {
    balanced: [
      { name: "Breakfast", time: "8:00 AM", items: "Oatmeal with berries, almonds, and Greek yogurt", calories: "400 kcal" },
      { name: "Lunch", time: "12:30 PM", items: "Grilled chicken salad with quinoa, mixed vegetables, and olive oil dressing", calories: "500 kcal" },
      { name: "Snack", time: "3:30 PM", items: "Apple with peanut butter and a handful of nuts", calories: "250 kcal" },
      { name: "Dinner", time: "7:00 PM", items: "Baked salmon with roasted sweet potatoes and steamed broccoli", calories: "550 kcal" }
    ],
    vegetarian: [
      { name: "Breakfast", time: "8:00 AM", items: "Scrambled tofu with spinach, whole grain toast, and avocado", calories: "400 kcal" },
      { name: "Lunch", time: "12:30 PM", items: "Quinoa bowl with chickpeas, roasted vegetables, and tahini dressing", calories: "450 kcal" },
      { name: "Snack", time: "3:30 PM", items: "Greek yogurt with honey and mixed nuts", calories: "200 kcal" },
      { name: "Dinner", time: "7:00 PM", items: "Lentil curry with brown rice and side salad", calories: "500 kcal" }
    ],
    vegan: [
      { name: "Breakfast", time: "8:00 AM", items: "Smoothie bowl with banana, berries, plant protein, chia seeds", calories: "350 kcal" },
      { name: "Lunch", time: "12:30 PM", items: "Buddha bowl with quinoa, roasted chickpeas, avocado, and vegetables", calories: "450 kcal" },
      { name: "Snack", time: "3:30 PM", items: "Hummus with carrot and cucumber sticks", calories: "200 kcal" },
      { name: "Dinner", time: "7:00 PM", items: "Black bean burgers with sweet potato fries and salad", calories: "500 kcal" }
    ],
    lowCarb: [
      { name: "Breakfast", time: "8:00 AM", items: "Vegetable omelette with cheese and avocado", calories: "400 kcal" },
      { name: "Lunch", time: "12:30 PM", items: "Grilled chicken Caesar salad (no croutons) with Parmesan", calories: "450 kcal" },
      { name: "Snack", time: "3:30 PM", items: "Celery sticks with almond butter and string cheese", calories: "180 kcal" },
      { name: "Dinner", time: "7:00 PM", items: "Zucchini noodles with meatballs and sugar-free marinara", calories: "500 kcal" }
    ],
    highProtein: [
      { name: "Breakfast", time: "8:00 AM", items: "3-egg omelette with turkey bacon and cottage cheese", calories: "450 kcal" },
      { name: "Lunch", time: "12:30 PM", items: "Grilled chicken breast with quinoa and steamed vegetables", calories: "500 kcal" },
      { name: "Snack", time: "3:30 PM", items: "Protein shake with banana and almond milk", calories: "250 kcal" },
      { name: "Dinner", time: "7:00 PM", items: "Lean steak with roasted potatoes and asparagus", calories: "550 kcal" }
    ]
  };

  return dietPlans[dietPreference] || dietPlans.balanced;
}