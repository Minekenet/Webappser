
import React from 'react';
import { TechStack, Translation } from '../types';

interface ConfigPanelProps {
  techStack: TechStack;
  setTechStack: (t: TechStack) => void;
  disabled: boolean;
  t: Translation;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ techStack, setTechStack, disabled, t }) => {
  // Only allow stacks that run natively in browser without node_modules/bundling
  const frameworks = ["HTML/JS", "React"];
  const stylings = ["Tailwind", "CSS"];

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 flex flex-wrap gap-4 justify-center animate-fade-in opacity-0" style={{animation: 'fadeIn 0.5s ease-out forwards 0.2s'}}>
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.stack}</span>
        
        <select 
          value={techStack.framework}
          onChange={(e) => setTechStack({...techStack, framework: e.target.value as any})}
          disabled={disabled}
          className="bg-gray-50 text-gray-700 text-sm rounded-md border-none focus:ring-2 focus:ring-blue-100 py-1 px-2 cursor-pointer outline-none"
        >
          {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <span className="text-gray-300">/</span>

        <select 
          value={techStack.styling}
          onChange={(e) => setTechStack({...techStack, styling: e.target.value as any})}
          disabled={disabled}
          className="bg-gray-50 text-gray-700 text-sm rounded-md border-none focus:ring-2 focus:ring-blue-100 py-1 px-2 cursor-pointer outline-none"
        >
          {stylings.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="w-full text-center mt-2">
         <p className="text-[10px] text-gray-400">
           {techStack.framework === 'React' 
             ? "React will be used via ES Modules (CDN), no build step required." 
             : "Standard vanilla HTML/JS structure."}
         </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
