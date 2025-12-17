
import React, { useState } from 'react';
import { User, Translation, PageView } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onNavigate: (page: PageView) => void;
  onSwitchToRegister: () => void;
  t: Translation;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onNavigate, onSwitchToRegister, t }) => {
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = (): boolean => {
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      setError(t.errorEmail || "Invalid email");
      return false;
    }
    
    if (password.length < 6) {
      setError(t.errorPassword || "Password too short");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate API call for Login
    setTimeout(() => {
      // Mock Login Logic
      const mockUser: User = {
        id: 'user_login_' + Math.random().toString(36).substr(2, 9),
        email: email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email}&background=0D8ABC&color=fff`
      };
      
      onLogin(mockUser);
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 text-xl">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t.welcomeBack}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {t.enterDetails}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t.email}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t.password}</label>
             <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs font-medium flex items-center gap-1.5 bg-red-50 p-2 rounded-lg">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gray-900 text-white font-medium py-3.5 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : t.signIn}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={onSwitchToRegister} 
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            {t.dontHaveAccount}
          </button>
        </div>

      </div>
    </div>
  );
};
