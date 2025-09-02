
import React, { useState, useRef } from 'react';
import type { MenuPlan, Meal } from '../types';
import { XIcon, DownloadIcon } from './Icons';

interface MenuDisplayProps {
  menuPlan: MenuPlan | null;
}

declare const jspdf: any;
declare const html2canvas: any;

const RecipeDetailModal: React.FC<{ meal: Meal, onClose: () => void }> = ({ meal, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><XIcon /></button>
        <h3 className="text-3xl font-bold mb-4 text-blue-600">{meal.nombre}</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-lg mb-2 border-b pb-1">Comentario Nutricional</h4>
            <p className="bg-blue-50 text-blue-800 p-3 rounded-lg italic text-sm">{meal.comentarioMotivador}</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2 border-b pb-1">Información Nutricional</h4>
            <p className="text-slate-600 text-sm">{meal.infoNutricional}</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2 border-b pb-1">Ingredientes</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
              {meal.ingredientes.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2 border-b pb-1">Preparación</h4>
            <p className="text-slate-600 whitespace-pre-wrap text-sm">{meal.preparacion}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ menuPlan }) => {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
                  <button onClick={() => setSelectedMeal(day.comida)} className="text-left w-full text-blue-600 hover:bg-blue-50 p-2 rounded-md transition-colors">
                    <span className="font-semibold text-sm">{day.comida.nombre}</span>
                  </button>
                ) : <div className="h-10"></div>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">CENA</p>
                {day.cena ? (
                  <button onClick={() => setSelectedMeal(day.cena)} className="text-left w-full text-purple-600 hover:bg-purple-50 p-2 rounded-md transition-colors">
                    <span className="font-semibold text-sm">{day.cena.nombre}</span>
                  </button>
                ) : <div className="h-10"></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedMeal && <RecipeDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />}
    </div>
  );
};
