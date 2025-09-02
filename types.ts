
export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  notes?: string; // e.g., "basketball player"
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string;
}

export interface Meal {
  nombre: string;
  ingredientes: string[];
  preparacion: string;
  infoNutricional: string;
  comentarioMotivador: string;
}

export interface DayMenu {
  dia: string; // e.g., "Lunes"
  fecha: string; // e.g., "2024-07-29"
  comida: Meal | null;
  cena: Meal | null;
}

export type MenuPlan = DayMenu[];

export enum AppSection {
  Generator = 'GENERATOR',
  Profiles = 'PROFILES',
  Recipes = 'RECIPES',
}
