import { GoogleGenAI, Type } from "@google/genai";
import type { Profile, Recipe, MenuPlan, Meal } from '../types';

// Schema for the initial plan (names only)
const menuPlanSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      dia: { type: Type.STRING },
      fecha: { type: Type.STRING },
      comida: { type: Type.OBJECT, properties: { nombre: { type: Type.STRING } } },
      cena: { type: Type.OBJECT, properties: { nombre: { type: Type.STRING } } },
    },
  },
};

// Schema for the detailed recipe of a single meal
const recipeDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING },
        ingredientes: { type: Type.ARRAY, items: { type: Type.STRING } },
        preparacion: { type: Type.STRING },
        infoNutricional: {
            type: Type.OBJECT,
            properties: {
                calorias: { type: Type.NUMBER },
                proteinas: { type: Type.NUMBER },
                carbohidratos: { type: Type.NUMBER },
                grasas: { type: Type.NUMBER },
            }
        },
        comentarioMotivador: { type: Type.STRING, description: "A brief, encouraging tip from a nutritionist's perspective about this specific dish." }
    }
};

const buildPrompt = (profiles: Profile[], recipes: Recipe[], duration: number, startDate: Date, includeBreakfasts: boolean): string => {
  const profilesText = profiles.map(p => 
    `- ${p.name}: ${p.age} years old ${p.gender}, activity level: ${p.activityLevel}. Notes: ${p.notes || 'none'}`
  ).join('\n');

  const recipesText = recipes.length > 0
    ? `Consider including these user-provided family recipes if they fit the nutritional plan:\n${recipes.map(r => `- ${r.name}: ${r.ingredients}`).join('\n')}`
    : "No specific family recipes were provided.";
  
  const breakfastText = includeBreakfasts ? "Please include breakfast suggestions." : "Do NOT generate breakfasts. Only generate meals for 'comida' (lunch) and 'cena' (dinner).";

  return `
    You are an expert nutritionist designing a meal plan for a family in Madrid, Spain.
    Your recommendations must be based on the Mediterranean diet, prioritizing seasonal, national products.
    The plan needs to cater to the specific needs of each family member.

    FAMILY PROFILES:
    ${profilesText}

    NUTRITIONAL GUIDELINES:
    1.  For the teenage athletes (12 and 15): High protein intake is crucial for muscle growth and recovery. Ensure their meals are energy-dense with complex carbohydrates.
    2.  For the adults (50 years old): Focus on preventing sarcopenia (muscle loss) with adequate high-quality protein. Include sources of calcium and vitamin D for bone health.
    3.  For everyone: Promote gut health (microbiota) by including fiber, prebiotics (garlic, onions, whole grains), and probiotics (yogurt, kefir). Diversify protein sources (fish, legumes, lean meats).
    4.  All recipes should be adapted for the number of people in the family (${profiles.length}).
    5.  ${breakfastText}
    
    USER'S RECIPES:
    ${recipesText}

    TASK:
    Generate a ${duration}-day meal plan starting on ${startDate.toISOString().split('T')[0]}.
    The output must be a valid JSON array of objects, strictly adhering to the provided schema.
    For each day, provide ONLY the name of the dish for lunch ('comida') and dinner ('cena'). DO NOT generate ingredients or preparation steps in this initial request.
    The language must be Spanish (from Spain).
  `;
};

const getApiKey = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY environment variable is not set.");
    throw new Error("La API key de Google no está configurada. Debes añadirla como una variable de entorno en tu plataforma de despliegue (ej. Vercel) para que la aplicación pueda funcionar.");
  }
  return apiKey;
};

export const generateMealPlan = async (
  profiles: Profile[],
  recipes: Recipe[],
  duration: number,
  startDate: Date,
  includeBreakfasts: boolean
): Promise<MenuPlan> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = buildPrompt(profiles, recipes, duration, startDate, includeBreakfasts);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: menuPlanSchema,
      },
    });

    const jsonString = response.text;
    if (!jsonString) {
        throw new Error("La respuesta del modelo de IA estaba vacía.");
    }
    
    const parsedPlan: MenuPlan = JSON.parse(jsonString);
    return parsedPlan;

  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error("No se pudo generar el plan de comidas. Revisa tu API Key y la configuración.");
  }
};

export const generateRecipeDetails = async (mealName: string, familySize: number): Promise<Omit<Meal, 'nombre'>> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `
        You are an expert nutritionist and chef.
        Provide a detailed recipe for the dish: "${mealName}".
        The recipe should be for a family of ${familySize} people.
        
        The output must be a single valid JSON object, strictly adhering to the provided schema.
        It must include:
        1. 'nombre': The exact name of the dish as provided.
        2. 'ingredientes': A list of ingredients with quantities.
        3. 'preparacion': Step-by-step cooking instructions.
        4. 'infoNutricional': An estimated nutritional analysis per serving (calories, protein, carbs, fat).
        5. 'comentarioMotivador': A brief, encouraging tip from a nutritionist about this dish.
        
        The language must be Spanish (from Spain).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeDetailsSchema,
            },
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error("Empty response from AI for recipe details.");
        }

        const parsedDetails: Meal = JSON.parse(jsonString);
        // We already have the name, so we just return the other details.
        const { nombre, ...details } = parsedDetails;
        return details;

    } catch (error) {
        console.error(`Error generating details for "${mealName}":`, error);
        throw new Error(`No se pudieron generar los detalles para la receta: ${mealName}.`);
    }
};
