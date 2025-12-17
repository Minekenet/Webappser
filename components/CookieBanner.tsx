
import React, { useState, useEffect } from 'react';
import { Translation } from '../types';

interface CookieBannerProps {
  t: Translation;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem('vibe_coder_cookie_consent');
    if (!consented) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleConsent = (type: 'all' | 'necessary') => {
    localStorage.setItem('vibe_coder_cookie_consent', type);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-slide-up pointer-events-none">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-5 pointer-events-auto">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
             <i className="fa-solid fa-cookie-bite text-xl"></i>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">{t.cookiesTitle}</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t.cookiesText}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleConsent('necessary')}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t.cookiesNecessary}
          </button>
          <button 
            onClick={() => handleConsent('all')}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors shadow-sm"
          >
            {t.cookiesAll}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
