
import React, { useState } from 'react';
import { User, AiConfig, AiProvider, DEFAULT_AI_CONFIG, Translation, PageView } from '../types';

interface OnboardingProps {
  onComplete: (user: User, config: AiConfig) => void;
  onNavigate: (page: PageView) => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
  t: Translation;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onNavigate, onClose, onSwitchToLogin, t }) => {
  const [step, setStep] = useState(1);
  
  // Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Config State
  const [config, setConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);

  const validateStep1 = (): boolean => {
    setError(null);
    if (!name.trim()) {
      setError(t.errorName || "Name required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.errorEmail || "Invalid email");
      return false;
    }
    if (password.length < 6) {
      setError(t.errorPassword || "Password too short");
      return false;
    }
    if (!agreed) {
      setError(t.errorTerms || "Must agree to terms");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const user: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`
    };
    onComplete(user, config);
  };

  const providers: {id: AiProvider, label: string, iconClass: string}[] = [
    { id: 'google', label: 'Gemini', iconClass: 'fa-brands fa-google' },
    { id: 'openrouter', label: 'OpenRouter', iconClass: 'fa-solid fa-network-wired' },
    { id: 'openai', label: 'OpenAI', iconClass: 'fa-solid fa-robot' },
    { id: 'custom', label: 'Custom', iconClass: 'fa-solid fa-server' },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[550px] relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-900 transition-colors bg-white/50 rounded-full p-2 hover:bg-white border border-transparent hover:border-gray-100 shadow-sm md:hidden"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-900 transition-colors hidden md:block"
        >
           <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {/* Left Side - Visual & Info */}
        <div className="w-full md:w-5/12 bg-gray-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
             <h2 className="text-3xl font-bold leading-tight mb-2 font-serif">
               Webappser
             </h2>
             <h3 className="text-lg font-medium opacity-80 mb-6">
               {step === 1 ? t.onboardingWelcome : t.onboardingPower}
             </h3>
             <p className="text-gray-400 text-sm leading-relaxed">
               {step === 1 ? t.onboardingDesc1 : t.onboardingDesc2}
             </p>
          </div>

          <div className="flex gap-2 relative z-10 mt-8">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}></div>
          </div>

          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-40"></div>
          <div className="absolute top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-40"></div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col">
          
          <div className="flex-grow flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{t.fullName}</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none transition-all placeholder-gray-400"
                    placeholder="e.g. Alex Coder"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{t.email}</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none transition-all placeholder-gray-400"
                    placeholder="alex@example.com"
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{t.password}</label>
                   <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none transition-all placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      id="onboarding-terms"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 shadow transition-all checked:border-gray-900 checked:bg-gray-900 hover:shadow-md"
                    />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                      <i className="fa-solid fa-check text-[10px]"></i>
                    </span>
                  </div>
                  <label htmlFor="onboarding-terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                    {t.agreeTo} {' '}
                    <button 
                      type="button" 
                      onClick={() => onNavigate('terms')} 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {t.termsOfService}
                    </button>
                    {' '} {t.and} {' '}
                    <button 
                       type="button" 
                       onClick={() => onNavigate('privacy')}
                       className="text-blue-600 hover:underline font-medium"
                    >
                      {t.privacyPolicy}
                    </button>
                  </label>
                </div>

                {error && (
                  <div className="text-red-500 text-xs font-medium flex items-center gap-1.5 bg-red-50 p-2 rounded-lg">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Provider Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t.provider}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {providers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setConfig({...config, provider: p.id})}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${config.provider === p.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                         <i className={`${p.iconClass} text-lg mb-1`}></i>
                         <span className="text-[10px] font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Input */}
                <div className="relative group">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                     {config.provider === 'custom' ? t.baseUrl : t.apiKey}
                   </label>
                   
                   {(config.provider === 'custom' || config.provider === 'openai') && (
                     <div className="mb-3">
                       <input 
                          type="text"
                          value={config.baseUrl}
                          onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                          placeholder="https://api.openai.com/v1" 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none mb-2"
                        />
                     </div>
                   )}

                   <div className="relative">
                      <input 
                        type="password" 
                        value={config.apiKey}
                        onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none transition-all"
                        placeholder="sk-..."
                      />
                      <div className="absolute left-3.5 top-3.5 text-gray-400">
                        <i className="fa-solid fa-key"></i>
                      </div>
                   </div>
                   
                   <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
                      <i className="fa-solid fa-circle-info mt-0.5 text-blue-400"></i>
                      <p>
                        {t.needKey} 
                        {config.provider === 'google' && <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 hover:underline ml-1">Get Gemini Key</a>}
                        {config.provider === 'openrouter' && <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-500 hover:underline ml-1">Get OpenRouter Key</a>}
                        {config.provider === 'openai' && <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-500 hover:underline ml-1">Get OpenAI Key</a>}
                      </p>
                   </div>
                </div>

              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
             {step === 2 ? (
               <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                 {t.back}
               </button>
             ) : <div></div>}

             <button 
               onClick={handleNext}
               disabled={step === 2 && !config.apiKey}
               className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
             >
               {step === 1 ? t.continue : t.startCoding}
             </button>
          </div>
          
          {/* Switch to Login */}
          <div className="mt-6 text-center">
             <button 
               type="button"
               onClick={onSwitchToLogin}
               className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
             >
               {t.alreadyHaveAccount}
             </button>
          </div>

        </div>

      </div>
    </div>
  );
};
