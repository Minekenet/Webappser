
import React, { useState, useEffect } from 'react';
import { User, Translation } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (user: User) => void;
  t: Translation;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onSave, t }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar || '');
      setError('');
    }
  }, [isOpen, user]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    onSave({ ...user, name, email, avatar });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.profileEdit}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
               <img src={avatar || user.avatar} alt="Preview" className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-lg object-cover" />
               <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                 Change
               </div>
            </div>
          </div>
          
          <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avatar URL</label>
               <input 
                type="text" 
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                placeholder="https://..."
              />
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.fullName}</label>
             <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-gray-900 transition-all"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.email}</label>
             <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none text-gray-900 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button 
            onClick={handleSave}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
