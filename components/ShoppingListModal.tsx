import React from 'react';
import type { ShoppingList } from '../types';
import { XIcon, TrashIcon } from './Icons';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoppingList: ShoppingList;
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingList | null>>;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, shoppingList, setShoppingList }) => {

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const updatedList = { ...shoppingList };
    const category = updatedList.categorias.find(c => c.nombre === categoryId);
    if (category) {
      category.items = category.items.filter(item => item.id !== itemId);
    }
    setShoppingList(updatedList);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 20px;
            top: 20px;
            right: 20px;
            width: auto;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b no-print">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-slate-800">Lista de la Compra</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XIcon /></button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Aquí tienes todos los ingredientes para tu menú. Puedes eliminar los que ya tengas en casa antes de imprimir.
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto print-container">
            <div className="space-y-6">
              {shoppingList.categorias.filter(c => c.items.length > 0).map(category => (
                <div key={category.nombre}>
                  <h4 className="font-bold text-lg text-blue-600 border-b-2 border-blue-100 pb-2 mb-3">{category.nombre}</h4>
                  <ul className="space-y-2">
                    {category.items.map(item => (
                      <li key={item.id} className="flex justify-between items-center group p-1 rounded-md hover:bg-slate-50">
                        <div className="flex items-center">
                           <span className="font-semibold text-slate-700">{item.nombre}</span>
                           <span className="text-slate-500 ml-2 text-sm">({item.cantidad})</span>
                        </div>
                        <button onClick={() => handleDeleteItem(category.nombre, item.id)} className="no-print opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1">
                          <TrashIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t mt-auto no-print">
            <button
              onClick={handlePrint}
              className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              Imprimir Lista
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
