import React, { useState } from 'react';
import type { Profile, Recipe, MenuPlan, AppSection } from './types';
import { AppSection as AppSectionEnum } from './types';
import { generateMealPlan, generateRecipeDetails } from './services/geminiService';
import { ProfileManager } from './components/ProfileManager';
import { RecipeManager } from './components/RecipeManager';
import { MenuDisplay } from './components/MenuDisplay';
import { UserGroupIcon, BookOpenIcon, CalendarIcon } from './components/Icons';

// Initial state with default family profiles
const initialProfiles: Profile[] = [
  { id: '1', name: 'Adolescente 1', age: 15, gender: 'male', activityLevel: 'high', notes: 'Jugador de baloncesto' },
  { id: '2', name: 'Adolescente 2', age: 12, gender: 'female', activityLevel: 'high', notes: 'Jugadora de baloncesto' },
  { id: '3', name: 'Adulto 1', age: 50, gender: 'male', activityLevel: 'moderate', notes: '' },
  { id: '4', name: 'Adulto 2', age: 50, gender: 'female', activityLevel: 'moderate', notes: '' },
];

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuPlan, setMenuPlan] = useState<MenuPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSectionEnum.Generator);
  
  const [duration, setDuration] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [includeBreakfasts, setIncludeBreakfasts] = useState(false);

  const handleGenerateMenu = async () => {
    if (profiles.length === 0) {
      setError("Por favor, añada al menos un perfil familiar.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMenuPlan(null);
    try {
      const plan = await generateMealPlan(profiles, recipes, duration, new Date(startDate), includeBreakfasts);
      setMenuPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchMealDetails = async (dayIndex: number, mealType: 'comida' | 'cena') => {
    if (!menuPlan) return;
    
    const meal = menuPlan[dayIndex][mealType];
    if (!meal || meal.ingredientes) return; // Already has details

    setIsFetchingDetails(true);
    setError(null);
    try {
        const details = await generateRecipeDetails(meal.nombre, profiles.length);
        const updatedMenuPlan = [...menuPlan];
        updatedMenuPlan[dayIndex][mealType] = { ...meal, ...details };
        setMenuPlan(updatedMenuPlan);
    } catch (err: any) {
        setError(err.message || `No se pudieron cargar los detalles de "${meal.nombre}".`);
    } finally {
        setIsFetchingDetails(false);
    }
  };

  const NavButton: React.FC<{ section: AppSection, label: string, icon: React.ReactNode }> = ({ section, label, icon }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${activeSection === section ? 'bg-blue-500 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-800">
                Comida<span className="text-blue-500">Casa</span> AI Planner
            </h1>
            <nav className="flex gap-2 mt-4 sm:mt-0">
                <NavButton section={AppSectionEnum.Generator} label="Generador Menú" icon={<CalendarIcon />} />
                <NavButton section={AppSectionEnum.Profiles} label="Perfiles" icon={<UserGroupIcon />} />
                <NavButton section={AppSectionEnum.Recipes} label="Recetas" icon={<BookOpenIcon />} />
            </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className={activeSection === AppSectionEnum.Generator ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-6">
                <h2 className="text-xl font-bold text-slate-700">Configuración del Menú</h2>
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-600">Fecha de Inicio</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-600">Duración</label>
                    <select id="duration" value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value={7}>1 Semana</option>
                        <option value={14}>2 Semanas</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <input type="checkbox" id="includeBreakfasts" checked={includeBreakfasts} onChange={e => setIncludeBreakfasts(e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"/>
                    <label htmlFor="includeBreakfasts" className="ml-2 block text-sm text-slate-600">Incluir desayunos (opcional)</label>
                </div>
                <button onClick={handleGenerateMenu} disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {isLoading ? (
                        <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generando...</>
                    ) : '✨ Generar Menú con IA'}
                </button>
            </div>
            <div className="lg:col-span-2 space-y-6">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
                <MenuDisplay 
                    menuPlan={menuPlan} 
                    onFetchDetails={handleFetchMealDetails}
                    isFetchingDetails={isFetchingDetails}
                />
            </div>
          </div>
        </div>

        <div className={activeSection === AppSectionEnum.Profiles ? 'block' : 'hidden'}>
            <ProfileManager profiles={profiles} setProfiles={setProfiles} />
        </div>

        <div className={activeSection === AppSectionEnum.Recipes ? 'block' : 'hidden'}>
            <RecipeManager recipes={recipes} setRecipes={setRecipes} />
        </div>

      </main>
    </div>
  );
};

export default App;
