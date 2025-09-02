
import React, { useState } from 'react';
import type { Profile } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, XIcon } from './Icons';

interface ProfileManagerProps {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
}

const emptyProfile: Omit<Profile, 'id'> = {
  name: '',
  age: 0,
  gender: 'other',
  activityLevel: 'moderate',
  notes: ''
};

export const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, setProfiles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | Omit<Profile, 'id'>>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddProfile = () => {
    setEditingProfile(emptyProfile);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setProfiles(profiles.map(p => p.id === (editingProfile as Profile).id ? (editingProfile as Profile) : p));
    } else {
      setProfiles([...profiles, { ...editingProfile, id: crypto.randomUUID() }]);
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingProfile({ ...editingProfile, [name]: name === 'age' ? parseInt(value) || 0 : value });
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-700">Perfiles Familiares</h2>
        <button onClick={handleAddProfile} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          <PlusIcon /> Añadir Perfil
        </button>
      </div>
      <div className="space-y-3">
        {profiles.map(profile => (
          <div key={profile.id} className="p-4 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-200">
            <div>
              <p className="font-semibold">{profile.name}, {profile.age} años</p>
              <p className="text-sm text-slate-500 capitalize">{profile.gender}, Actividad {profile.activityLevel}</p>
              {profile.notes && <p className="text-sm text-slate-500">Notas: {profile.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEditProfile(profile)} className="p-2 text-slate-500 hover:text-blue-600"><PencilIcon /></button>
              <button onClick={() => handleDeleteProfile(profile.id)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">{isEditing ? 'Editar Perfil' : 'Añadir Perfil'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800"><XIcon /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nombre</label>
                <input type="text" name="name" id="name" value={editingProfile.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-slate-600">Edad</label>
                <input type="number" name="age" id="age" value={editingProfile.age} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-600">Género</label>
                <select name="gender" id="gender" value={editingProfile.gender} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label htmlFor="activityLevel" className="block text-sm font-medium text-slate-600">Nivel de Actividad</label>
                <select name="activityLevel" id="activityLevel" value={editingProfile.activityLevel} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="sedentary">Sedentario</option>
                  <option value="light">Ligera</option>
                  <option value="moderate">Moderada</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-600">Notas (e.g., Deportista)</label>
                <textarea name="notes" id="notes" value={editingProfile.notes} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors">Cancelar</button>
                 <button type="submit" className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
