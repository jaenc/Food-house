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
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido en el servidor.' }));
    throw new Error(errorData.message || "No se pudo generar el plan de comidas desde el servidor.");
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
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido en el servidor.' }));
    throw new Error(errorData.message || `No se pudieron generar los detalles para la receta: ${mealName}.`);
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
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.message || 'No se pudo generar la lista de la compra desde el servidor.');
    }
    return response.json();
};
