import type { Profile, Recipe, MenuPlan, Meal, ShoppingList } from '../types';

const fetchWithRetryAndBetterErrors = async (
    url: string,
    options: RequestInit,
    errorMessagePrefix: string
) => {
    const retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);

            if (response.ok) {
                return response.json();
            }

            // Retry on 503 (Overloaded) or 504 (Gateway Timeout) which are common for overloaded APIs
            if ((response.status === 503 || response.status === 504) && i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
                continue;
            }

            // If not retryable or retries exhausted, parse and throw a detailed error
            let finalErrorMessage = `${errorMessagePrefix} (Error ${response.status}).`;
            const errorText = await response.text();
            
            try {
                const errorData = JSON.parse(errorText);

                // Check for Google's specific nested error structure: { error: { message: '...' } }
                if (errorData.error && typeof errorData.error.message === 'string') {
                    finalErrorMessage = errorData.error.message;
                } else if (typeof errorData.message === 'string') {
                    finalErrorMessage = errorData.message;
                } else {
                    // Fallback for other JSON structures
                    finalErrorMessage = `Respuesta de error inesperada: ${JSON.stringify(errorData)}`;
                }

                // Override with a more user-friendly message for common, understandable issues
                if (response.status === 503) {
                    finalErrorMessage = `El servicio de IA está experimentando una alta demanda. Por favor, inténtelo de nuevo en unos minutos.`;
                }

            } catch (e) {
                // If the error response is not JSON
                finalErrorMessage = `Respuesta inesperada del servidor: ${errorText.slice(0, 300)}`;
            }

            throw new Error(finalErrorMessage);

        } catch (error) {
            // Handle network errors or other fetch exceptions
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
                continue;
            }
            // If it's the last retry, re-throw the caught error
            throw error;
        }
    }
    // This part should be unreachable if the loop logic is correct
    throw new Error('Se superaron los reintentos de la API.');
};


export const generateMealPlan = async (
  profiles: Profile[],
  recipes: Recipe[],
  duration: number,
  startDate: Date,
  includeBreakfasts: boolean
): Promise<MenuPlan> => {
  return fetchWithRetryAndBetterErrors(
    '/api/generatePlan',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profiles, recipes, duration, startDate, includeBreakfasts }),
    },
    'Error al generar el plan de comidas'
  );
};

export const generateRecipeDetails = async (mealName: string, familySize: number): Promise<Omit<Meal, 'nombre'>> => {
  return fetchWithRetryAndBetterErrors(
    '/api/generateDetails',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealName, familySize }),
    },
    `Error al obtener detalles para ${mealName}`
  );
};

export const generateShoppingList = async (menuPlan: MenuPlan, profiles: Profile[]): Promise<ShoppingList> => {
    return fetchWithRetryAndBetterErrors(
        '/api/generateShoppingList',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ menuPlan, profiles }),
        },
        'Error al generar la lista de la compra'
    );
};
