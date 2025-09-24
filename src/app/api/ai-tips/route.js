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

    // Initialize the Gemini client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use a reliable model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const prompt = `
You are an expert fitness and nutrition consultant. Please provide personalized advice based on the following user profile:

USER PROFILE:
- Weight: ${weight} kg
- Height: ${height} cm
- Age: ${age} years
- Gender: ${gender}
- Activity Level: ${activity}
- BMI: ${bmi} (${getBMICategory(parseFloat(bmi))})
- Diet Preference: ${dietPreference}
- Goal: ${goal}

REQUEST:
1. Provide 5 concise, actionable health and fitness tips specific to this user's profile
2. Create a sample daily diet plan with 4-5 meals (breakfast, lunch, snack, dinner) that includes:
   - Meal names
   - Suggested timing (e.g., "8:00 AM")
   - Specific food items appropriate for their ${dietPreference} diet
   - Approximate calories per meal
   - Total daily calories should align with their ${goal} goal

RESPONSE FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "dietPlan": [
    {
      "name": "Meal Name",
      "time": "HH:MM AM/PM",
      "items": "Food description",
      "calories": "XXX kcal"
    }
  ]
}

Important: Return only valid JSON without any additional text, explanations, or markdown formatting.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse the response
    const cleanedText = text.replace(/```json|```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!data.tips || !data.dietPlan || !Array.isArray(data.tips) || !Array.isArray(data.dietPlan)) {
        throw new Error("Invalid response structure from AI");
      }
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("JSON parsing failed, using fallback:", parseError);
      // If JSON parsing fails, extract tips from text and use fallback diet plan
      const tips = extractTipsFromText(text);
      return new Response(JSON.stringify({
        tips: tips.length >= 3 ? tips : getFallbackTips(goal, dietPreference),
        dietPlan: getFallbackDietPlan(dietPreference)
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI API Error:", error);
    return new Response(JSON.stringify({ 
      tips: getFallbackTips(goal, dietPreference),
      dietPlan: getFallbackDietPlan(dietPreference)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to determine BMI category
function getBMICategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Helper function to extract tips from text if JSON parsing fails
function extractTipsFromText(text) {
  try {
    // Look for numbered tips or bullet points
    const tipMatches = text.match(/(?:\d+\.\s|[-•*]\s)(.+?)(?=\n\d+\.|\n[-•*]|\n\n|$)/g);
    if (tipMatches) {
      return tipMatches.map(tip => tip.replace(/^\d+\.\s|^[-•*]\s/, '').trim()).slice(0, 5);
    }
    
    // Fallback: split by new lines and take meaningful ones
    return text.split('\n')
      .filter(line => line.trim().length > 20 && !line.includes('{') && !line.includes('}'))
      .slice(0, 5)
      .map(line => line.trim());
  } catch (e) {
    return [];
  }
}

// Fallback tips for when the AI service is unavailable
function getFallbackTips(goal, dietPreference) {
  const baseTips = [
    "Stay hydrated by drinking at least 8 glasses of water daily",
    "Aim for 7-9 hours of quality sleep each night",
    "Incorporate both cardio and strength training in your routine",
    "Focus on whole foods and minimize processed foods",
    "Consider consulting with a nutritionist for personalized advice"
  ];

  const goalSpecificTips = {
    lose: [
      "Create a moderate calorie deficit of 300-500 calories per day",
      "Focus on protein-rich foods to maintain muscle mass while losing fat",
      "Incorporate high-fiber foods to help you feel full longer"
    ],
    maintain: [
      "Balance your macronutrients for sustained energy throughout the day",
      "Listen to your body's hunger and fullness cues",
      "Maintain consistent meal timing for metabolic regularity"
    ],
    gain: [
      "Aim for a calorie surplus of 300-500 calories per day for lean mass gain",
      "Prioritize protein intake to support muscle growth and recovery",
      "Consider nutrient-dense calorie sources rather than empty calories"
    ]
  };

  return [...(goalSpecificTips[goal] || []).slice(0, 2), ...baseTips.slice(0, 3)];
}

// Fallback diet plan for when the AI service is unavailable
function getFallbackDietPlan(dietPreference) {
  const basePlan = [
    {
      name: "Breakfast",
      time: "8:00 AM",
      items: "Oatmeal with berries and nuts",
      calories: "350 kcal"
    },
    {
      name: "Lunch",
      time: "12:30 PM",
      items: "Grilled chicken salad with quinoa and vegetables",
      calories: "450 kcal"
    },
    {
      name: "Snack",
      time: "3:30 PM",
      items: "Greek yogurt with honey and almonds",
      calories: "200 kcal"
    },
    {
      name: "Dinner",
      time: "7:00 PM",
      items: "Baked salmon with roasted vegetables and sweet potato",
      calories: "500 kcal"
    }
  ];

  const dietModifications = {
    vegetarian: {
      Lunch: "Vegetable stir-fry with tofu and brown rice",
      Dinner: "Lentil curry with whole grain naan"
    },
    vegan: {
      Breakfast: "Smoothie bowl with plant-based protein, fruits, and seeds",
      Lunch: "Chickpea and vegetable curry with quinoa",
      Dinner: "Vegan Buddha bowl with tempeh and tahini dressing",
      Snack: "Hummus with vegetable sticks"
    },
    lowCarb: {
      Breakfast: "Vegetable omelette with avocado",
      Lunch: "Grilled chicken Caesar salad (no croutons)",
      Dinner: "Zucchini noodles with meatballs and marinara sauce",
      Snack: "Cheese and nuts"
    },
    highProtein: {
      Breakfast: "Scrambled eggs with spinach and turkey bacon",
      Lunch: "Grilled chicken breast with steamed broccoli and quinoa",
      Dinner: "Lean steak with asparagus and sweet potato",
      Snack: "Protein shake with banana"
    }
  };

  if (dietModifications[dietPreference]) {
    return basePlan.map(meal => ({
      ...meal,
      items: dietModifications[dietPreference][meal.name] || meal.items
    }));
  }

  return basePlan;
}