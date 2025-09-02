import { GoogleGenAI, Type } from "@google/genai";
import type { MenuPlan, Profile, Meal } from '../types';

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
    const familySize = profiles.length;

    const fullMealDetails = menuPlan
        .flatMap(day => [day.comida, day.cena])
        .filter((meal): meal is Meal => meal !== null && meal.ingredientes !== undefined && meal.ingredientes.length > 0)
        .map(meal => `Plato: ${meal.nombre}\nIngredientes: ${meal.ingredientes!.join(', ')}`)
        .join('\n\n');

    return `
        Eres un nutricionista y chef experto creando una lista de la compra optimizada para una familia.

        TAREA:
        Basado en la siguiente lista de platos y sus ingredientes, genera una lista de la compra completa y consolidada. Las recetas ya están calculadas para el tamaño de la familia (${familySize} personas).

        LISTA DE PLATOS E INGREDIENTES:
        ${fullMealDetails}

        INSTRUCCIONES:
        1. Consolida todos los ingredientes de la lista proporcionada. Si un ingrediente se usa en varios platos, suma las cantidades totales (ej. si una receta necesita "2 cebollas" y otra "1 cebolla", el total es "3 cebollas"). Presta atención a las unidades (gramos, litros, unidades).
        2. Organiza la lista final en categorías lógicas para facilitar la compra en un supermercado (ej: 'Frutas y Verduras', 'Carnes y Pescados', 'Despensa', 'Lácteos y Huevos', 'Otros').
        3. Asegúrate de que las cantidades en la lista final sean claras y agregadas.
        4. A cada item de la lista asígnale un ID único usando un UUID.

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
