
import React from 'react';
import { Translation, PageView } from '../types';

interface LegalPageProps {
  type: 'terms' | 'privacy';
  onBack: () => void;
  t: Translation;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack, t }) => {
  const isTerms = type === 'terms';
  const title = isTerms ? t.termsOfService : t.privacyPolicy;

  // Placeholder content since we don't have real legal text yet
  // In a real app, this would be fetched from a CMS or markdown file
  const content = isTerms ? (
    <div className="space-y-4">
      <p>Welcome to Webappser. By accessing our website, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
      
      <h3 className="text-xl font-bold text-gray-900 mt-6">1. Use License</h3>
      <p>Permission is granted to temporarily download one copy of the materials (information or software) on Webappser's website for personal, non-commercial transitory viewing only.</p>
      
      <h3 className="text-xl font-bold text-gray-900 mt-6">2. Disclaimer</h3>
      <p>The materials on Webappser's website are provided on an 'as is' basis. Webappser makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      
      <h3 className="text-xl font-bold text-gray-900 mt-6">3. API Usage</h3>
      <p>Users are responsible for their own API keys. Webappser does not store API keys on its servers; they are stored locally on your device.</p>
    </div>
  ) : (
    <div className="space-y-4">
      <p>Your privacy is important to us. It is Webappser's policy to respect your privacy regarding any information we may collect from you across our website.</p>
      
      <h3 className="text-xl font-bold text-gray-900 mt-6">1. Information We Collect</h3>
      <p>We only collect information about you if we have a reason to do so – for example, to provide our services, to communicate with you, or to make our services better.</p>
      
      <h3 className="text-xl font-bold text-gray-900 mt-6">2. Local Storage</h3>
      <p>We use local storage to save your preferences, generated projects, and API keys. This data resides on your device and is not transmitted to our servers unless explicitly required for a feature (like generating code via a proxy, if applicable).</p>
      
      <h3 className="text-xl font-bold text-gray-900 mt-6">3. Third Party Services</h3>
      <p>We may employ third-party companies and individuals due to the following reasons: To facilitate our Service; To provide the Service on our behalf; To perform Service-related services.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-fade-in">
      {/* Simple Header for Legal Pages */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="font-bold text-gray-900 font-serif text-lg">Webappser</span>
             <span className="text-gray-300 mx-2">|</span>
             <span className="text-sm font-medium text-gray-500">{t.legalTitle}</span>
           </div>
           <button 
             onClick={onBack}
             className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
           >
             <i className="fa-solid fa-xmark"></i>
             {t.back}
           </button>
        </div>
      </div>

      <div className="flex-grow p-6 md:p-12">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
           <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
           <p className="text-gray-400 text-sm mb-8">{t.lastUpdated}</p>
           
           <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
             {content}
           </div>
        </div>
      </div>
      
      <div className="py-8 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Webappser. All rights reserved.
      </div>
    </div>
  );
};