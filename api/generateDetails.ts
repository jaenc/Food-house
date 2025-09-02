import { GoogleGenAI, Type } from "@google/genai";
import type { Meal } from '../types';

export const config = {
  runtime: 'edge',
};

// Schema for the detailed recipe of a single meal
const recipeDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING },
        ingredientes: { type: Type.ARRAY, items: { type: Type.STRING } },
        preparacion: { 
            type: Type.STRING,
            description: "Instrucciones de cocinado paso a paso. Cada paso numerado debe estar separado del siguiente por un carácter de nueva línea ('\\n')."
        },
        infoNutricional: {
            type: Type.OBJECT,
            properties: {
                calorias: { type: Type.NUMBER },
                proteinas: { type: Type.NUMBER },
                carbohidratos: { type: Type.NUMBER },
                grasas: { type: Type.NUMBER },
            },
            required: ['calorias', 'proteinas', 'carbohidratos', 'grasas'],
        },
        comentarioMotivador: { type: Type.STRING, description: "Un consejo breve y motivador desde la perspectiva de un nutricionista sobre este plato específico." }
    },
    required: ['nombre', 'ingredientes', 'preparacion', 'infoNutricional', 'comentarioMotivador'],
};


export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Only POST requests allowed' }), { status: 405 });
    }

    try {
        const { mealName, familySize } = await req.json();

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set on the server.");
            return new Response(JSON.stringify({ message: "La API key de Google no está configurada en el servidor." }), { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
            Eres un nutricionista y chef experto.
            Proporciona una receta detallada para el plato: "${mealName}".
            La receta debe ser para una familia de ${familySize} personas.
            
            La salida debe ser un único objeto JSON válido, adhiriéndose estrictamente al esquema proporcionado.
            Debe incluir:
            1. 'nombre': El nombre exacto del plato proporcionado.
            2. 'ingredientes': Una lista de ingredientes con cantidades.
            3. 'preparacion': Instrucciones de cocinado paso a paso. MUY IMPORTANTE: Separa cada paso numerado con un único salto de línea ('\\n') para que cada paso aparezca en una línea distinta.
            4. 'infoNutricional': Un análisis nutricional estimado por ración (calorías, proteínas, carbohidratos, grasas).
            5. 'comentarioMotivador': Un consejo breve y motivador de un nutricionista sobre este plato.
            
            El idioma debe ser español (de España).
        `;

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
            throw new Error("Respuesta vacía de la IA para los detalles de la receta.");
        }

        // Parse to validate, then return the raw string from the AI.
        // The client expects the full Meal object for the details.
        JSON.parse(jsonString);
        
        return new Response(jsonString, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Error in /api/generateDetails:", error);
        return new Response(JSON.stringify({ message: error.message || 'Error interno del servidor.' }), { status: 500 });
    }
}
