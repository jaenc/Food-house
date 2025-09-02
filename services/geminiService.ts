import type { Profile, Recipe, MenuPlan, Meal, ShoppingList } from '../types';

export const generateMealPlan = async (
  profiles: Profile[],
  recipes: Recipe[],
  duration: number,
  startDate: Date,
  includeBreakfasts: boolean
): Promise<MenuPlan> => {
  const response = await fetch('/api/generatePlan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profiles, recipes, duration, startDate, includeBreakfasts }),
  });

  if (!response.ok) {
    let errorMessage = `Error del servidor (${response.status}) al generar el plan.`;
    const errorText = await response.text(); // Leer el cuerpo UNA SOLA VEZ
    try {
      const errorData = JSON.parse(errorText); // Intentar analizar el texto como JSON
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // Si falla, es porque no era JSON, usamos el texto directamente
      errorMessage = `Respuesta inesperada del servidor: ${errorText.slice(0, 200)}`;
      console.error("Respuesta no JSON del servidor:", errorText);
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const generateRecipeDetails = async (mealName: string, familySize: number): Promise<Omit<Meal, 'nombre'>> => {
  const response = await fetch('/api/generateDetails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealName, familySize }),
  });

  if (!response.ok) {
    let errorMessage = `Error del servidor (${response.status}) al obtener detalles para ${mealName}.`;
    const errorText = await response.text(); // Leer el cuerpo UNA SOLA VEZ
    try {
      const errorData = JSON.parse(errorText); // Intentar analizar el texto como JSON
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
       // Si falla, es porque no era JSON, usamos el texto directamente
      errorMessage = `Respuesta inesperada del servidor para ${mealName}: ${errorText.slice(0, 200)}`;
      console.error("Respuesta no JSON del servidor:", errorText);
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const generateShoppingList = async (menuPlan: MenuPlan, profiles: Profile[]): Promise<ShoppingList> => {
    const response = await fetch('/api/generateShoppingList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuPlan, profiles }),
    });

    if (!response.ok) {
        let errorMessage = `Error del servidor (${response.status}) al generar la lista de la compra.`;
        const errorText = await response.text(); // Leer el cuerpo UNA SOLA VEZ
        try {
          const errorData = JSON.parse(errorText); // Intentar analizar el texto como JSON
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
           // Si falla, es porque no era JSON, usamos el texto directamente
          errorMessage = `Respuesta inesperada del servidor: ${errorText.slice(0, 200)}`;
          console.error("Respuesta no JSON del servidor:", errorText);
        }
        throw new Error(errorMessage);
    }
    return response.json();
};
