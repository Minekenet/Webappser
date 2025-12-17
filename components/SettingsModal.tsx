
import React, { useState, useEffect } from 'react';
import { AiConfig, AiProvider, AiPreset, Translation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiConfig;
  onSave: (config: AiConfig, presets: AiPreset[]) => void;
  presets: AiPreset[];
  t: Translation;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave, presets: initialPresets, t }) => {
  // Local state for the list of presets
  const [localPresets, setLocalPresets] = useState<AiPreset[]>([]);
  // The ID of the preset currently being edited/viewed in the right pane
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  // The state of the form being edited
  const [editingPreset, setEditingPreset] = useState<AiPreset | null>(null);
  
  // Delete Confirmation State
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalPresets(initialPresets.length > 0 ? initialPresets : [config]);
      const active = initialPresets.find(p => p.apiKey === config.apiKey && p.provider === config.provider) || initialPresets[0];
      if (active) {
         setSelectedPresetId(active.id);
         setEditingPreset(active);
      } else {
         const tempId = 'temp_' + Date.now();
         const temp: AiPreset = { ...config, id: tempId, name: 'Unsaved Config', capabilities: { image: true, file: true } };
         setLocalPresets([temp, ...initialPresets]);
         setSelectedPresetId(tempId);
         setEditingPreset(temp);
      }
    }
  }, [isOpen, initialPresets, config]);

  const handleCreatePreset = () => {
    const newPreset: AiPreset = {
      id: 'preset_' + Date.now(),
      name: 'New Preset',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4o',
      capabilities: { image: true, file: true }
    };
    setLocalPresets([...localPresets, newPreset]);
    setSelectedPresetId(newPreset.id);
    setEditingPreset(newPreset);
  };

  const handleConfirmDelete = () => {
    if (!presetToDelete) return;
    
    if (localPresets.length <= 1) {
       setPresetToDelete(null);
       return; 
    }

    const newPresets = localPresets.filter(p => p.id !== presetToDelete);
    setLocalPresets(newPresets);
    
    if (selectedPresetId === presetToDelete) {
      setSelectedPresetId(newPresets[0].id);
      setEditingPreset(newPresets[0]);
    }
    
    onSave(config, newPresets); 
    setPresetToDelete(null);
  };

  const handleUpdateEditing = (updates: Partial<AiPreset>) => {
    if (!editingPreset) return;
    const updated = { ...editingPreset, ...updates };
    setEditingPreset(updated);
    
    const updatedList = localPresets.map(p => p.id === updated.id ? updated : p);
    setLocalPresets(updatedList);
  };

  const handleSaveOnly = () => {
    if (editingPreset && editingPreset.id === config.id) {
       onSave(editingPreset, localPresets);
    } else {
       onSave(config, localPresets);
    }
    onClose();
  }

  const handleActivate = () => {
    if (editingPreset && editingPreset.apiKey) {
      onSave(editingPreset, localPresets);
      onClose();
    }
  };

  if (!isOpen) return null;

  const providers: {id: AiProvider, label: string, iconClass: string}[] = [
    { id: 'google', label: 'Google Gemini', iconClass: 'fa-brands fa-google' },
    { id: 'openrouter', label: 'OpenRouter', iconClass: 'fa-solid fa-network-wired' },
    { id: 'openai', label: 'OpenAI', iconClass: 'fa-solid fa-robot' },
    { id: 'custom', label: 'Custom/Local', iconClass: 'fa-solid fa-server' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Delete Confirmation Modal */}
      {presetToDelete && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/20" onClick={() => setPresetToDelete(null)}></div>
           <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full relative z-10 animate-fade-in">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
               <i className="fa-solid fa-trash-can"></i>
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">{t.deleteTitle}</h3>
             <p className="text-sm text-gray-500 mb-6">{t.deleteDesc}</p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setPresetToDelete(null)}
                 className="flex-1 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
               >
                 {t.cancel}
               </button>
               <button 
                 onClick={handleConfirmDelete}
                 className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
               >
                 {t.confirm}
               </button>
             </div>
           </div>
        </div>
      )}
      
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] max-h-[90vh] z-10">
        
        {/* Sidebar: Preset List */}
        <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{t.presets}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {localPresets.map(preset => (
              <div
                key={preset.id}
                className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 group relative cursor-pointer ${
                  selectedPresetId === preset.id 
                    ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' 
                    : 'bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-200'
                }`}
                onClick={() => { setSelectedPresetId(preset.id); setEditingPreset(preset); }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                   selectedPresetId === preset.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  <i className={`
                    ${preset.provider === 'google' ? 'fa-brands fa-google' : ''}
                    ${preset.provider === 'openrouter' ? 'fa-solid fa-network-wired' : ''}
                    ${preset.provider === 'openai' ? 'fa-solid fa-robot' : ''}
                    ${preset.provider === 'custom' ? 'fa-solid fa-server' : ''}
                  `}></i>
                </div>
                <div className="overflow-hidden flex-1">
                  <div className={`text-sm font-semibold truncate ${selectedPresetId === preset.id ? 'text-gray-900' : 'text-gray-600'}`}>
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate uppercase">
                    {preset.provider}
                  </div>
                </div>
                {config.id === preset.id && (
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm mr-2" title={t.active}></div>
                )}
                
                {localPresets.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPresetToDelete(preset.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white text-red-400 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:text-red-600 hover:bg-red-50"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={handleCreatePreset}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white hover:shadow-sm hover:border-gray-300 transition-all"
            >
              <i className="fa-solid fa-plus"></i>
              {t.addPreset}
            </button>
          </div>
        </div>

        {/* Main: Edit Form */}
        <div className="w-full md:w-2/3 flex flex-col bg-white">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{t.manageModels}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {editingPreset ? (
              <div className="space-y-6">
                
                {/* Preset Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.presetName}</label>
                  <input 
                    type="text" 
                    value={editingPreset.name}
                    onChange={(e) => handleUpdateEditing({ name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none font-bold text-gray-900 transition-all"
                  />
                </div>

                {/* Provider Grid */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.provider}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {providers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleUpdateEditing({ 
                          provider: p.id,
                          model: p.id === 'google' ? 'gemini-2.5-flash' : p.id === 'openai' ? 'gpt-4o' : ''
                        })}
                        className={`
                          flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                          ${editingPreset.provider === p.id 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}
                        `}
                      >
                         <i className={`${p.iconClass} text-xl mb-2`}></i>
                         <span className="text-[10px] font-bold">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.apiKey}</label>
                  <div className="relative group">
                    <input 
                      type="password" 
                      value={editingPreset.apiKey}
                      onChange={(e) => handleUpdateEditing({ apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none font-mono transition-all"
                    />
                    <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                      <i className="fa-solid fa-key"></i>
                    </div>
                  </div>
                </div>

                {/* Base URL & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(editingPreset.provider === 'custom' || editingPreset.provider === 'openai' || editingPreset.provider === 'openrouter') && (
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.baseUrl}</label>
                       <div className="relative group">
                          <input 
                            type="text" 
                            value={editingPreset.baseUrl || ''}
                            onChange={(e) => handleUpdateEditing({ baseUrl: e.target.value })}
                            placeholder={editingPreset.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1'}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none font-mono transition-all"
                          />
                          <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                             <i className="fa-solid fa-link"></i>
                          </div>
                       </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model ID</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={editingPreset.model || ''}
                        onChange={(e) => handleUpdateEditing({ model: e.target.value })}
                        placeholder={editingPreset.provider === 'google' ? 'gemini-2.5-flash' : 'gpt-4o'}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-200 outline-none font-mono transition-all"
                      />
                      <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                        <i className="fa-solid fa-microchip"></i>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Capabilities */}
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.capabilities}</label>
                   <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <label className="flex items-center gap-3 cursor-pointer select-none p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={editingPreset.capabilities?.image ?? true}
                            onChange={(e) => handleUpdateEditing({ 
                                capabilities: { ...editingPreset.capabilities, image: e.target.checked } 
                            })}
                          />
                          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t.supportsImage}</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={editingPreset.capabilities?.file ?? false}
                            onChange={(e) => handleUpdateEditing({ 
                                capabilities: { ...editingPreset.capabilities, file: e.target.checked } 
                            })}
                          />
                          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t.supportsFile}</span>
                      </label>
                   </div>
                   <p className="text-xs text-gray-400 mt-2 px-1">Check capabilities supported by your chosen model.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-700">
                  <i className="fa-solid fa-shield-halved mt-0.5"></i>
                  <p>{t.cookiesText}</p>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a preset to edit
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div></div>
            <div className="flex gap-3">
              <button 
                onClick={handleSaveOnly}
                className="px-6 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              >
                {t.saveChanges}
              </button>
              <button 
                onClick={handleActivate}
                disabled={!editingPreset?.apiKey}
                className="px-8 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="fa-solid fa-bolt"></i>
                {t.activate}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
