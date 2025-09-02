import React, { useState } from 'react';
import type { Recipe } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface RecipeManagerProps {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({ recipes, setRecipes }) => {
  const [newRecipe, setNewRecipe] = useState({ name: '', ingredients: '' });

  const handleAddRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecipe.name && newRecipe.ingredients) {
      setRecipes([...recipes, { ...newRecipe, id: crypto.randomUUID() }]);
      setNewRecipe({ name: '', ingredients: '' });
    }
  };
  
  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1); // Skip header
        const importedRecipes: Recipe[] = lines
          // Fix: Explicitly type the return value of map to prevent overly-specific type inference for `id`.
          .map((line): Recipe | null => {
            const [name, ingredients] = line.split(',');
            if (name && ingredients) {
              return { id: crypto.randomUUID(), name: name.trim(), ingredients: ingredients.trim() };
            }
            return null;
          })
          .filter((r): r is Recipe => r !== null);
        setRecipes([...recipes, ...importedRecipes]);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-4">Recetas Familiares</h2>
      
      <form onSubmit={handleAddRecipe} className="mb-6 space-y-4">
        <div>
          <label htmlFor="recipeName" className="block text-sm font-medium text-slate-600">Nombre de la Comida</label>
          <input 
            type="text" 
            id="recipeName"
            value={newRecipe.name}
            onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Lentejas de la abuela"
          />
        </div>
        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-slate-600">Ingredientes</label>
          <textarea
            id="ingredients"
            value={newRecipe.ingredients}
            onChange={(e) => setNewRecipe({...newRecipe, ingredients: e.target.value})}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Lentejas, chorizo, patata, zanahoria..."
          />
        </div>
        <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          <PlusIcon /> Añadir Receta
        </button>
      </form>

      <div className="mb-6">
        <label htmlFor="csv-upload" className="block text-sm font-medium text-slate-600 mb-2">O importar desde CSV</label>
        <input 
          type="file" 
          id="csv-upload"
          accept=".csv"
          onChange={handleCsvImport}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-slate-400 mt-1">El CSV debe tener dos columnas: 'nombre', 'ingredientes'.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-600">Recetas Guardadas</h3>
        {recipes.length > 0 ? recipes.map(recipe => (
          <div key={recipe.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-200">
            <div>
              <p className="font-semibold">{recipe.name}</p>
              <p className="text-sm text-slate-500">{recipe.ingredients}</p>
            </div>
            <button onClick={() => handleDeleteRecipe(recipe.id)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon /></button>
          </div>
        )) : <p className="text-slate-500 text-center py-4">No hay recetas guardadas.</p>}
      </div>
    </div>
  );
};