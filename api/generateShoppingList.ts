import { GoogleGenAI, Type } from "@google/genai";
import type { MenuPlan, Profile } from '../types';

export const config = {
  runtime: 'edge',
};

const shoppingListSchema = {
    type: Type.OBJECT,
    properties: {
        categorias: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    nombre: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING, description: "Un ID único para el item, por ejemplo un UUID." },
                                nombre: { type: Type.STRING },
                                cantidad: { type: Type.STRING },
                            },
                            required: ['id', 'nombre', 'cantidad'],
                        },
                    },
                },
                required: ['nombre', 'items'],
            },
        },
    },
    required: ['categorias'],
};

const buildPrompt = (menuPlan: MenuPlan, profiles: Profile[]): string => {
    const mealList = menuPlan.map(day => `${day.dia}: ${day.comida?.nombre} y ${day.cena?.nombre}`).join('\n');
    const familySize = profiles.length;

    return `
        Eres un nutricionista y chef experto creando una lista de la compra optimizada para una familia.

        TAREA:
        Basado en el siguiente plan de comidas para ${familySize} personas, genera una lista de la compra completa y consolidada para toda la semana.

        PLAN DE COMIDAS:
        ${mealList}

        INSTRUCCIONES:
        1. Para cada plato del menú, calcula los ingredientes y las cantidades exactas necesarias para ${familySize} personas.
        2. Consolida todos los ingredientes de todas las recetas. Si un ingrediente se usa en varios platos, suma las cantidades totales (ej. si necesitas 2 cebollas para una receta y 1 para otra, el total es 3 cebollas).
        3. Organiza la lista final en categorías lógicas para facilitar la compra en un supermercado (ej: 'Frutas y Verduras', 'Carnes y Pescados', 'Despensa', 'Lácteos y Huevos', 'Otros').
        4. Proporciona cantidades claras y específicas (ej. "500g de pechuga de pollo", "3 cebollas grandes", "1L de leche").
        5. A cada item de la lista asígnale un ID único usando un UUID.

        La salida debe ser un único objeto JSON válido, adhiriéndose estrictamente al esquema proporcionado. El idioma debe ser español (de España).
    `;
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Only POST requests allowed' }), { status: 405 });
    }

    try {
        const { menuPlan, profiles } = await req.json();

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set on the server.");
            return new Response(JSON.stringify({ message: "La API key de Google no está configurada en el servidor." }), { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = buildPrompt(menuPlan, profiles);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: shoppingListSchema,
            },
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error("Respuesta vacía de la IA para la lista de la compra.");
        }

        JSON.parse(jsonString); // Validate JSON

        return new Response(jsonString, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Error in /api/generateShoppingList:", error);
        return new Response(JSON.stringify({ message: error.message || 'Error interno del servidor.' }), { status: 500 });
    }
}
