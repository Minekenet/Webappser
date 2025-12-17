
import React, { useState, useRef } from 'react';
import { AiConfig, Translation } from '../types';

interface InputAreaProps {
  prompt: string;
  setPrompt: (s: string) => void;
  aiConfig: AiConfig;
  onOpenSettings: () => void;
  onBuild: (files: File[]) => void;
  checkAuth: (action: () => void) => void;
  isLoading: boolean;
  t: Translation;
}

export const InputArea: React.FC<InputAreaProps> = ({
  prompt,
  setPrompt,
  aiConfig,
  onOpenSettings,
  onBuild,
  checkAuth,
  isLoading,
  t
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      checkAuth(() => {
        if (prompt.trim() && aiConfig.apiKey.trim()) onBuild(selectedFiles);
      });
    }
  };

  const handleAttachClick = (type: 'image' | 'file') => {
    checkAuth(() => {
      if (type === 'image') imageInputRef.current?.click();
      else fileInputRef.current?.click();
    });
  };

  const hasApiKey = !!aiConfig.apiKey;
  const supportsImages = aiConfig.capabilities?.image !== false; 
  const supportsFiles = !!aiConfig.capabilities?.file; 

  return (
    <div className="w-full max-w-3xl mx-auto z-10">
      
      {/* Main Card */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 relative overflow-hidden p-2">
        
        {/* Status Bar */}
        <div className="px-4 py-2 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {hasApiKey ? `${t.using} ${aiConfig.name || aiConfig.provider}` : t.aiNotConnected}
              </span>
           </div>
           {/* Settings Button */}
           <button 
             onClick={() => checkAuth(onOpenSettings)}
             className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-50"
             title={t.aiSettings}
           >
             <i className="fa-solid fa-sliders text-sm"></i>
           </button>
        </div>

        {/* Input Field */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => checkAuth(() => {})}
            onKeyDown={handleKeyDown}
            placeholder={t.inputPlaceholder}
            className="w-full bg-transparent border-none focus:ring-0 text-lg text-gray-800 placeholder-gray-400 p-4 resize-none h-24 sm:h-28 rounded-2xl disabled:opacity-50"
            disabled={isLoading}
          />
        </div>

        {/* Attachments List */}
        {selectedFiles.length > 0 && (
          <div className="px-4 pb-1">
             {/* Added p-3 to container to prevent clipping of absolute positioned close buttons */}
             <div className="flex gap-3 overflow-x-auto custom-scrollbar animate-fade-in p-3 -ml-3">
                {selectedFiles.map((file, idx) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <div key={idx} className="relative group shrink-0">
                        {isImage ? (
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="Ref" 
                            className="h-16 w-16 object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center shadow-sm text-xs text-gray-600 font-medium px-1 text-center">
                              <i className="fa-regular fa-file-code text-lg mb-1 text-gray-400"></i>
                              <span className="truncate w-full text-[9px]">{file.name}</span>
                          </div>
                        )}
                        <button 
                          onClick={() => removeFile(idx)}
                          className="absolute -top-2 -right-2 bg-white text-gray-400 border border-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:text-red-500 hover:bg-red-50 hover:border-red-100 shadow-sm transition-all z-10"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    )
                })}
             </div>
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 pb-2 pt-1 gap-3 sm:gap-0">
          
          {/* Left Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
             {/* Image Button */}
             {supportsImages ? (
               <>
                <button 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    title={t.uploadImage}
                    onClick={() => handleAttachClick('image')}
                    disabled={isLoading}
                  >
                    <i className="fa-regular fa-image text-lg"></i>
                  </button>
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden" 
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                  />
               </>
             ) : (
               <div className="p-2 text-gray-200 cursor-not-allowed" title="Current model does not support images">
                 <i className="fa-regular fa-image text-lg"></i>
               </div>
             )}

             {/* File Button */}
             {supportsFiles ? (
               <>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    title={t.uploadFile}
                    onClick={() => handleAttachClick('file')}
                    disabled={isLoading}
                  >
                     <i className="fa-solid fa-paperclip text-lg"></i>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    // Accept common code/text formats
                    accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.css,.html,.py"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                  />
               </>
             ) : (
               <div className="p-2 text-gray-200 cursor-not-allowed" title="Current model does not support file attachments">
                  <i className="fa-solid fa-paperclip text-lg"></i>
               </div>
             )}
              
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all" 
                disabled={isLoading}
                onClick={() => checkAuth(() => {})}
              >
                <i className="fa-solid fa-microphone text-lg"></i>
              </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!hasApiKey ? (
               <button 
                 onClick={() => checkAuth(onOpenSettings)}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
               >
                 <i className="fa-solid fa-plug"></i>
                 <span>{t.connectAi}</span>
               </button>
            ) : (
              <>
                <button 
                  onClick={() => setPrompt("Create a landing page for a futuristic architecture firm using dark mode.")}
                  className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>{t.surpriseMe}</span>
                </button>

                <button 
                  onClick={() => checkAuth(() => {
                    if(prompt.trim()) onBuild(selectedFiles);
                  })}
                  disabled={isLoading || !prompt.trim()}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md
                    ${(isLoading || !prompt.trim())
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02] hover:shadow-lg'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>{t.building}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.generate}</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
