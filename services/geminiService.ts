import { GoogleGenAI, Type } from "@google/genai";
import type { Profile, Recipe, MenuPlan } from '../types';

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      dia: { type: Type.STRING, description: "Day of the week in Spanish (e.g., 'Lunes')." },
      fecha: { type: Type.STRING, description: "Date in YYYY-MM-DD format." },
      comida: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          ingredientes: { type: Type.ARRAY, items: { type: Type.STRING } },
          preparacion: { type: Type.STRING },
          infoNutricional: { type: Type.STRING, description: "Caloric, nutritional composition, and properties of the food." },
          comentarioMotivador: { type: Type.STRING, description: "A science-based motivational comment about the recipe's benefits." },
        },
      },
      cena: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          ingredientes: { type: Type.ARRAY, items: { type: Type.STRING } },
          preparacion: { type: Type.STRING },
          infoNutricional: { type: Type.STRING, description: "Caloric, nutritional composition, and properties of the food." },
          comentarioMotivador: { type: Type.STRING, description: "A science-based motivational comment about the recipe's benefits." },
        },
      },
    },
  },
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
    For each dish, provide detailed nutritional information and a science-based motivational comment.
    The language must be Spanish (from Spain).
  `;
};

export const generateMealPlan = async (
  profiles: Profile[],
  recipes: Recipe[],
  duration: number,
  startDate: Date,
  includeBreakfasts: boolean
): Promise<MenuPlan> => {
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    console.error("VITE_API_KEY environment variable is not set.");
    throw new Error("La API key de Google no está configurada. Debes añadirla como una variable de entorno en tu plataforma de despliegue (ej. Vercel) para que la aplicación pueda funcionar.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(profiles, recipes, duration, startDate, includeBreakfasts);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text;

    if (!jsonString) {
        throw new Error("La respuesta del modelo de IA estaba vacía. Esto puede ocurrir si la solicitud es demasiado compleja.");
    }
    
    const parsedPlan: MenuPlan = JSON.parse(jsonString);
    return parsedPlan;

  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error("No se pudo generar el menú. La IA tardó demasiado o encontró un error. Esto puede deberse a un problema con la API Key o a que la solicitud es demasiado compleja para el modelo. Revisa tu API Key y prueba de nuevo, quizás con una duración más corta.");
  }
};
