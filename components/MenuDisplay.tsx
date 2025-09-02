import React, { useState, useRef } from 'react';
import type { MenuPlan, Meal } from '../types';
import { XIcon, DownloadIcon } from './Icons';

interface MenuDisplayProps {
  menuPlan: MenuPlan | null;
  onFetchDetails: (dayIndex: number, mealType: 'comida' | 'cena') => Promise<void>;
  isFetchingDetails: boolean;
}

declare const jspdf: any;
declare const html2canvas: any;

const RecipeDetailModal: React.FC<{ meal: Meal, onClose: () => void, isLoading: boolean }> = ({ meal, onClose, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-10"><XIcon /></button>
        <h3 className="text-3xl font-bold mb-6 text-slate-800">{meal.nombre}</h3>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
                <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-4 text-slate-600">Generando receta detallada...</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                 {meal.comentarioMotivador && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
                        <h4 className="font-bold text-blue-800">Consejo del Nutricionista</h4>
                        <p className="text-sm text-blue-700 mt-1">{meal.comentarioMotivador}</p>
                    </div>
                )}
                <div>
                    <h4 className="font-bold text-lg mb-2 border-b pb-1 text-slate-700">Ingredientes</h4>
                    <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm marker:text-blue-500">
                    {meal.ingredientes?.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                </div>
                <div className="mt-6">
                    <h4 className="font-bold text-lg mb-2 border-b pb-1 text-slate-700">Preparación</h4>
                    <div className="text-slate-600 whitespace-pre-wrap text-sm space-y-2 prose prose-sm">
                        {meal.preparacion?.split('\n').map((step, i) => <p key={i}>{step}</p>)}
                    </div>
                </div>
            </div>
            <div className="md:col-span-1">
                 {meal.infoNutricional && (
                    <div className="bg-slate-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h4 className="font-bold text-lg text-slate-700">Nutrición</h4>
                        </div>
                        <div className="text-center bg-white p-4 rounded-lg shadow-inner">
                            <p className="text-xs text-slate-500">Calorías (aprox.)</p>
                            <p className="text-4xl font-bold text-blue-600">{meal.infoNutricional.calorias}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mt-4">
                            <div>
                                <p className="text-xs text-slate-500">Proteína</p>
                                <p className="font-bold text-slate-800">{meal.infoNutricional.proteinas}g</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Carbs</p>
                                <p className="font-bold text-slate-800">{meal.infoNutricional.carbohidratos}g</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Grasa</p>
                                <p className="font-bold text-slate-800">{meal.infoNutricional.grasas}g</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuPlan, onFetchDetails, isFetchingDetails }) => {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMealClick = async (dayIndex: number, mealType: 'comida' | 'cena') => {
    if (!menuPlan) return;
    const meal = menuPlan[dayIndex][mealType];
    if (!meal) return;
    
    setSelectedMeal(meal); // Show modal immediately with just the name

    // If details (like ingredients) are not already fetched, fetch them
    if (!meal.ingredientes) {
        await onFetchDetails(dayIndex, mealType);
    }
  };

  // When the menuPlan updates after fetching, we need to update the selectedMeal state
  // to re-render the modal with the new details.
  React.useEffect(() => {
    if (selectedMeal && menuPlan) {
        const updatedMeal = menuPlan
            .flatMap(day => [day.comida, day.cena])
            .find(m => m?.nombre === selectedMeal.nombre);
        if (updatedMeal && updatedMeal.ingredientes) {
            setSelectedMeal(updatedMeal);
        }
    }
  }, [menuPlan]);


  const handleExportToPDF = () => {
    if (menuRef.current) {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a3'
        });
        html2canvas(menuRef.current, { scale: 2 }).then((canvas: any) => {
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            if (height > pdfHeight) {
              // This case would need more complex multi-page logic, for now it fits
            }

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`menu-semanal-${new Date().toISOString().split('T')[0]}.pdf`);
        });
    }
  };


  if (!menuPlan) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-md border border-slate-200">
        <p className="text-slate-500">Genere un menú para verlo aquí.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-700">Tu Menú Personalizado</h2>
        <button onClick={handleExportToPDF} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
            <DownloadIcon /> Exportar a PDF
        </button>
      </div>
      <div ref={menuRef} className="grid grid-cols-1 md:grid-cols-7 gap-1 p-2 bg-slate-50 rounded-lg">
        {menuPlan.map((day, index) => (
          <div key={index} className="border border-slate-200 bg-white rounded-lg">
            <div className="p-2 bg-slate-100 rounded-t-lg">
              <p className="font-bold text-center text-slate-700 text-sm">{day.dia}</p>
              <p className="text-xs text-center text-slate-500">{day.fecha}</p>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">COMIDA</p>
                {day.comida ? (
                  <button onClick={() => handleMealClick(index, 'comida')} className="text-left w-full text-blue-600 hover:bg-blue-50 p-2 rounded-md transition-colors">
                    <span className="font-semibold text-sm">{day.comida.nombre}</span>
                  </button>
                ) : <div className="h-10"></div>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">CENA</p>
                {day.cena ? (
                  <button onClick={() => handleMealClick(index, 'cena')} className="text-left w-full text-purple-600 hover:bg-purple-50 p-2 rounded-md transition-colors">
                    <span className="font-semibold text-sm">{day.cena.nombre}</span>
                  </button>
                ) : <div className="h-10"></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedMeal && <RecipeDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} isLoading={isFetchingDetails && !selectedMeal.ingredientes} />}
    </div>
  );
};
