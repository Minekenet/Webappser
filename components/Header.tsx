
import React, { useState, useEffect, useRef } from 'react';
import { User, Language, Translation } from '../types';

interface HeaderProps {
  user: User | null;
  language: Language;
  onLanguageChange: (l: Language) => void;
  onLoginClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  onProfileClick: () => void;
  t: Translation;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  language,
  onLanguageChange,
  onLoginClick, 
  onSettingsClick, 
  onLogoutClick, 
  onProfileClick,
  t
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: {code: Language, label: string, flag: string}[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="pt-6 px-4 flex justify-center w-full z-50 fixed top-0 left-0 right-0 pointer-events-none">
      <header className="pointer-events-auto w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-6 py-3 flex justify-between items-center transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => window.location.reload()}>
            <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block font-serif">Webappser</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Language Selector */}
            <div className="relative" ref={langRef}>
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <i className="fa-solid fa-globe"></i>
                </button>
                {isLangOpen && (
                  <div className="absolute top-full right-0 mt-3 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                     {languages.map(l => (
                       <button
                         key={l.code}
                         onClick={() => { onLanguageChange(l.code); setIsLangOpen(false); }}
                         className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${language === l.code ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700'}`}
                       >
                         <span>{l.flag}</span>
                         <span>{l.label}</span>
                       </button>
                     ))}
                  </div>
                )}
            </div>

            {/* Profile / Auth */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                >
                  <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">{user.name}</span>
                  <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => { onProfileClick(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <i className="fa-regular fa-id-card text-gray-400 w-4"></i>
                        {t.editProfile}
                      </button>
                      <button 
                        onClick={() => { onSettingsClick(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <i className="fa-solid fa-sliders text-gray-400 w-4"></i>
                        {t.aiSettings}
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button 
                         onClick={() => { onLogoutClick(); setIsDropdownOpen(false); }}
                         className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket w-4"></i>
                        {t.signOut}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-black transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {t.signIn}
              </button>
            )}
          </div>
      </header>
    </div>
  );
};
