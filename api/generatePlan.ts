import { GoogleGenAI, Type } from "@google/genai";
import type { Profile, Recipe } from '../types';

// This tells Vercel to run this as a serverless function.
export const config = {
  runtime: 'edge',
};

// Schema for the initial plan (names only) - Kept here for server-side validation
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
    required: ['dia', 'fecha', 'comida', 'cena'],
  },
};

const buildPrompt = (profiles: Profile[], recipes: Recipe[], duration: number, startDate: Date, includeBreakfasts: boolean): string => {
  const profilesText = profiles.map(p => 
    `- ${p.name}: ${p.age} años ${p.gender}, nivel de actividad: ${p.activityLevel}. Notas: ${p.notes || 'ninguna'}`
  ).join('\n');

  const recipesText = recipes.length > 0
    ? `Considera incluir estas recetas familiares si encajan en el plan nutricional:\n${recipes.map(r => `- ${r.name}: ${r.ingredients}`).join('\n')}`
    : "No se proporcionaron recetas familiares específicas.";
  
  const breakfastText = includeBreakfasts ? "Por favor, incluye sugerencias para el desayuno." : "NO generes desayunos. Genera únicamente 'comida' (almuerzo) y 'cena'.";

  return `
    Eres un nutricionista experto diseñando un plan de comidas para una familia en Madrid, España.
    Tus recomendaciones deben basarse en la dieta mediterránea, priorizando productos nacionales de temporada.
    El plan debe adaptarse a las necesidades específicas de cada miembro de la familia.

    PERFILES FAMILIARES:
    ${profilesText}

    GUÍAS NUTRICIONALES:
    1. Para los adolescentes deportistas (12 y 15 años): Un alto consumo de proteínas es crucial para el crecimiento y la recuperación muscular. Asegura que sus comidas sean densas en energía con carbohidratos complejos.
    2. Para los adultos (50 años): Enfócate en prevenir la sarcopenia (pérdida de músculo) con suficiente proteína de alta calidad. Incluye fuentes de calcio y vitamina D para la salud ósea.
    3. Para todos: Promueve la salud intestinal (microbiota) incluyendo fibra, prebióticos (ajo, cebolla, granos integrales) y probióticos (yogur, kéfir). Diversifica las fuentes de proteína (pescado, legumbres, carnes magras).
    4. Todas las recetas deben estar adaptadas para el número de personas en la familia (${profiles.length}).
    5. ${breakfastText}
    
    RECETAS DEL USUARIO:
    ${recipesText}

    TAREA:
    Genera un plan de comidas para ${duration} días comenzando el ${startDate.toISOString().split('T')[0]}.
    La salida debe ser un array de objetos JSON válido, adhiriéndose estrictamente al esquema proporcionado.
    Para cada día, proporciona SOLO el nombre del plato para la 'comida' y la 'cena'. NO generes ingredientes ni pasos de preparación en esta petición inicial.
    El idioma debe ser español (de España).
  `;
};


export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Only POST requests allowed' }), { status: 405 });
  }

  try {
    const { profiles, recipes, duration, startDate, includeBreakfasts } = await req.json();
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set on the server.");
      return new Response(JSON.stringify({ message: "La API key de Google no está configurada en el servidor." }), { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(profiles, recipes, duration, new Date(startDate), includeBreakfasts);

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
    
    return new Response(jsonString, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error in /api/generatePlan:", error);
    return new Response(JSON.stringify({ message: error.message || 'Error interno del servidor.' }), { status: 500 });
  }
}
