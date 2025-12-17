
import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectFile, Translation, AiConfig, ChatMessage, EditAction, AiEditResponse, Language } from '../types';
import { translations } from '../translations'; // Import for language switching
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { Preview } from './Preview';
import { downloadProjectAsZip } from '../services/fileService';
import { editProjectCode } from '../services/geminiService';

// Declare globals for CDN libraries
declare const marked: any;
declare const hljs: any;

interface WorkspaceProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  aiConfig: AiConfig;
  t: Translation;
  language: Language;
}

export const Workspace: React.FC<WorkspaceProps> = ({ project, onBack, onUpdateProject, onDeleteProject, aiConfig, t, language: appLanguage }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  // Local Chat Language State (initialized from App language)
  const [currentLanguage, setCurrentLanguage] = useState<Language>(appLanguage);
  // Derived Translation object based on current local language
  const currentT = translations[currentLanguage];

  // Language Dropdown State in Workspace
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  
  // Renaming Project State
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(project.name);

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // History / Checkpoints
  const [history, setHistory] = useState<ProjectFile[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // File Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langRef.current && !langRef.current.contains(event.target as Node)) {
            setIsLangOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Configure marked with highlight.js
  useEffect(() => {
    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
      marked.setOptions({
        highlight: function(code: string, lang: string) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-',
      });
    }
  }, []);

  // Initialize Chat & History
  useEffect(() => {
    // Determine welcome text based on the INITIAL language passed
    const getWelcomeText = (lang: Language) => {
        switch(lang) {
            case 'ru': return `Я создал проект **${project.name}**. Я могу редактировать файлы, исправлять ошибки или добавлять функции. Просто спроси!`;
            case 'zh': return `我已经为你创建了 **${project.name}** 项目。我可以帮你编辑文件、修复错误或添加新功能。尽管问！`;
            case 'es': return `He generado el proyecto **${project.name}** para ti. Puedo ayudarte a editar archivos, corregir errores o agregar nuevas funciones. ¡Solo pregunta!`;
            case 'ja': return `プロジェクト **${project.name}** を作成しました。ファイルの編集、バグの修正、新機能の追加をお手伝いします。何でも聞いてください！`;
            default: return `I've generated the **${project.name}** project for you. I can help you edit files, fix bugs, or add new features. Just ask!`;
        }
    };

    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: getWelcomeText(currentLanguage),
          modelName: aiConfig.name || aiConfig.model || 'AI Model',
          timestamp: Date.now()
        }
      ]);
    }
    // Set initial checkpoint if empty
    if (history.length === 0 && project.files.length > 0) {
       setHistory([project.files]);
       setHistoryIndex(0);
    }
  }, [project.id]); // Only run on project mount/change
  
  // Update temp name when project changes
  useEffect(() => {
    setTempProjectName(project.name);
  }, [project.name]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Default select first file
  useEffect(() => {
    if (!selectedFileId && project.files.length > 0) {
      const index = project.files.find(f => f.name.toLowerCase() === 'index.html');
      if (index) {
        setSelectedFileId(index.id);
      } else {
        const firstFile = project.files.find(f => f.type === 'file');
        if (firstFile) setSelectedFileId(firstFile.id);
      }
    }
  }, [project.files, selectedFileId]);

  const selectedFile = project.files.find(f => f.id === selectedFileId) || null;

  // --- CHECKPOINT SYSTEM ---

  const saveCheckpoint = (newFiles: ProjectFile[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFiles);
    
    // Optional: Limit history size
    if (newHistory.length > 20) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Update Project
    onUpdateProject({ ...project, files: newFiles, lastModified: Date.now() });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onUpdateProject({ ...project, files: history[newIndex], lastModified: Date.now() });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onUpdateProject({ ...project, files: history[newIndex], lastModified: Date.now() });
    }
  };

  // --- EDIT LOGIC ---

  const handleFileChange = (newContent: string) => {
    if (!selectedFile) return;
    const updatedFiles = project.files.map(f => 
      f.id === selectedFile.id ? { ...f, content: newContent } : f
    );
    onUpdateProject({ ...project, files: updatedFiles, lastModified: Date.now() });
  };

  const handleSaveProjectName = () => {
    if (tempProjectName.trim() && tempProjectName !== project.name) {
      onUpdateProject({ ...project, name: tempProjectName.trim(), lastModified: Date.now() });
    }
    setIsRenamingProject(false);
  };

  const handleConfirmDelete = () => {
    onDeleteProject(project.id);
  };

  // --- File Management ---
  const handleCreateFile = (name: string, type: 'file' | 'folder', parentId: string | null) => {
    const newFile: ProjectFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      type,
      parentId: parentId || undefined,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? (name.split('.').pop() || 'txt') : undefined
    };
    saveCheckpoint([...project.files, newFile]);
    if (type === 'file') {
      setSelectedFileId(newFile.id);
      setActiveTab('editor');
    }
  };

  const handleRenameFile = (id: string, newName: string) => {
    const updatedFiles = project.files.map(f => 
      f.id === id ? { ...f, name: newName, language: f.type === 'file' ? (newName.split('.').pop() || 'txt') : f.language } : f
    );
    saveCheckpoint(updatedFiles);
  };

  const handleDeleteFile = (id: string) => {
    const getIdsToDelete = (rootId: string, allFiles: ProjectFile[]): string[] => {
      const children = allFiles.filter(f => f.parentId === rootId);
      let ids = [rootId];
      children.forEach(child => {
        ids = [...ids, ...getIdsToDelete(child.id, allFiles)];
      });
      return ids;
    };
    const idsToDelete = getIdsToDelete(id, project.files);
    const updatedFiles = project.files.filter(f => !idsToDelete.includes(f.id));
    if (selectedFileId && idsToDelete.includes(selectedFileId)) setSelectedFileId(null);
    saveCheckpoint(updatedFiles);
  };

  const handleMoveFile = (id: string, newParentId: string | null) => {
    if (newParentId) {
      let current = project.files.find(f => f.id === newParentId);
      while(current) {
        if (current.id === id) return; 
        current = project.files.find(f => f.id === current?.parentId);
      }
    }
    const file = project.files.find(f => f.id === id);
    if (file && (file.parentId || null) === newParentId) return; 
    const updatedFiles = project.files.map(f => 
      f.id === id ? { ...f, parentId: newParentId || undefined } : f
    );
    saveCheckpoint(updatedFiles);
  };

  // --- CHAT LOGIC ---

  const detectLanguage = (text: string): Language | null => {
    const cyrillicPattern = /[а-яА-ЯЁё]/;
    const chinesePattern = /[\u4e00-\u9fa5]/;
    const spanishPattern = /[áéíóúñ¡¿]/;
    const japanesePattern = /[\u3040-\u30ff\u31f0-\u31ff]/;
    if (cyrillicPattern.test(text)) return 'ru';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (spanishPattern.test(text)) return 'es';
    return null;
  };

  const applyAiEdits = (actions: EditAction[]) => {
    let currentFiles = [...project.files];
    const folderMap = new Map<string, string>(); // path -> id
    
    // Helper to build map of existing folders
    const buildPathMap = () => {
        folderMap.clear();
        const mapRecursive = (parentId: string | undefined, currentPath: string) => {
            const children = currentFiles.filter(f => f.parentId === parentId);
            children.forEach(child => {
                const path = currentPath ? `${currentPath}/${child.name}` : child.name;
                folderMap.set(path, child.id);
                if (child.type === 'folder') mapRecursive(child.id, path);
            });
        };
        mapRecursive(undefined, '');
    };

    buildPathMap();

    actions.forEach(action => {
       const parts = action.path.split('/');
       const fileName = parts.pop()!;
       const folderPath = parts.join('/');

       // Ensure folders exist for 'create' or 'update'
       let parentId: string | undefined = undefined;
       if (folderPath && (action.type === 'create' || action.type === 'update')) {
           let currentPath = '';
           let lastParentId: string | undefined = undefined;
           
           parts.forEach(part => {
               currentPath = currentPath ? `${currentPath}/${part}` : part;
               if (!folderMap.has(currentPath)) {
                   // Create folder
                   const newFolderId = 'folder_' + Math.random().toString(36).substr(2, 9);
                   const newFolder: ProjectFile = {
                       id: newFolderId,
                       name: part,
                       type: 'folder',
                       parentId: lastParentId
                   };
                   currentFiles.push(newFolder);
                   folderMap.set(currentPath, newFolderId);
                   lastParentId = newFolderId;
               } else {
                   lastParentId = folderMap.get(currentPath);
               }
           });
           parentId = lastParentId;
       }

       if (action.type === 'create' || action.type === 'update') {
           const existingIndex = currentFiles.findIndex(f => f.name === fileName && f.parentId === parentId && f.type === 'file');
           
           if (existingIndex >= 0) {
               currentFiles[existingIndex] = {
                   ...currentFiles[existingIndex],
                   content: action.content,
                   lastModified: Date.now()
               };
           } else {
               currentFiles.push({
                   id: 'file_' + Math.random().toString(36).substr(2, 9),
                   name: fileName,
                   type: 'file',
                   content: action.content || '',
                   language: fileName.split('.').pop() || 'txt',
                   parentId: parentId
               });
           }
       } else if (action.type === 'delete') {
           let deleteParentId: string | undefined = undefined;
           if (folderPath) {
               deleteParentId = folderMap.get(folderPath);
           }
           if (deleteParentId || !folderPath) {
               currentFiles = currentFiles.filter(f => !(f.name === fileName && f.parentId === deleteParentId));
           }
       }
    });

    saveCheckpoint(currentFiles);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if((!chatMessage.trim() && attachedFiles.length === 0) || isGenerating) return;

    // Detect if user changed language in chat
    const detectedInChat = detectLanguage(chatMessage);
    const effectiveLanguage = detectedInChat || currentLanguage;
    if (detectedInChat && detectedInChat !== currentLanguage) {
        setCurrentLanguage(detectedInChat);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatMessage,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setChatMessage('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);
    
    const startTime = performance.now();

    try {
        const response: AiEditResponse = await editProjectCode(
            project.files,
            userMsg.text,
            filesToSend,
            aiConfig,
            effectiveLanguage 
        );

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: response.explanation,
            modelName: aiConfig.name || aiConfig.model || 'AI',
            latency: `${duration}s`,
            timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, aiMsg]);
        applyAiEdits(response.actions);

    } catch (error: any) {
        console.error(error);
        const errorMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'model',
            text: `Error: ${error.message || "Something went wrong processing your request."}`,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsGenerating(false);
    }
  };

  const renderMessageContent = (text: string) => {
    // If marked/hljs not loaded yet, fallback to simple text
    if (typeof marked === 'undefined') {
        return text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}
                <br />
            </React.Fragment>
        ));
    }

    // Render Markdown
    try {
        const html = marked.parse(text);
        return <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
        return text;
    }
  };

  const supportsImages = aiConfig.capabilities?.image !== false; 
  const supportsFiles = !!aiConfig.capabilities?.file; 

  const handleDownload = () => downloadProjectAsZip(project.name, project.files);
  const handleAttachments = (files: FileList | null) => { if(files) setAttachedFiles(prev => [...prev, ...Array.from(files)]); };
  const removeAttachment = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  // Language Data
  const languages: {code: Language, flag: string}[] = [
    { code: 'en', flag: '🇺🇸' },
    { code: 'ru', flag: '🇷🇺' },
    { code: 'zh', flag: '🇨🇳' },
    { code: 'ja', flag: '🇯🇵' },
    { code: 'es', flag: '🇪🇸' },
  ];

  return (
    <div className="h-screen pt-20 flex flex-col bg-white overflow-hidden relative">
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
           <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full relative z-10 animate-fade-in">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
               <i className="fa-solid fa-triangle-exclamation text-xl"></i>
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Delete Workspace?</h3>
             <div className="flex gap-3">
               <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-xl text-gray-700 bg-gray-100 font-medium">Cancel</button>
               <button onClick={handleConfirmDelete} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-medium shadow-lg shadow-red-500/30">Delete</button>
             </div>
           </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          
          <div className="flex flex-col justify-center">
             {isRenamingProject ? (
               <input
                 type="text"
                 value={tempProjectName}
                 onChange={(e) => setTempProjectName(e.target.value)}
                 onBlur={handleSaveProjectName}
                 onKeyDown={(e) => e.key === 'Enter' && handleSaveProjectName()}
                 autoFocus
                 className="font-bold text-gray-800 bg-gray-50 border border-orange-200 rounded px-1.5 py-0.5 outline-none text-sm w-48"
               />
             ) : (
               <div className="flex items-center gap-2 group">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsRenamingProject(true)}>
                    <span className="font-bold text-gray-800 truncate max-w-[200px]">{project.name}</span>
                    <i className="fa-solid fa-pen text-gray-400 opacity-0 group-hover:opacity-100 text-xs"></i>
                 </div>
               </div>
             )}
             <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase font-bold text-gray-400">{project.techStack.framework}</span>
             </div>
          </div>

          {/* CHECKPOINTS CONTROLS */}
          <div className="flex items-center gap-1 ml-4 border-l pl-4 border-gray-200">
             <button 
               onClick={handleUndo} 
               disabled={historyIndex <= 0}
               className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
               title="Undo"
             >
               <i className="fa-solid fa-rotate-left"></i>
             </button>
             <button 
               onClick={handleRedo}
               disabled={historyIndex >= history.length - 1}
               className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
               title="Redo"
             >
               <i className="fa-solid fa-rotate-right"></i>
             </button>
             <div className="text-[10px] text-gray-300 font-mono ml-1">
               {historyIndex >= 0 ? `v${historyIndex + 1}` : ''}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             {/* Language Switcher for Chat */}
             <div className="relative" ref={langRef}>
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Chat Language"
                >
                  <span className="text-lg">{languages.find(l => l.code === currentLanguage)?.flag || '🌐'}</span>
                </button>
                {isLangOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                     {languages.map(l => (
                       <button
                         key={l.code}
                         onClick={() => { setCurrentLanguage(l.code); setIsLangOpen(false); }}
                         className={`w-full text-left px-4 py-2 text-xs flex items-center gap-3 hover:bg-gray-50 transition-colors ${currentLanguage === l.code ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700'}`}
                       >
                         <span>{l.flag}</span>
                         <span>{l.code.toUpperCase()}</span>
                       </button>
                     ))}
                  </div>
                )}
             </div>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
               <button onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <i className="fa-solid fa-code mr-2"></i> {currentT.editor}
               </button>
               <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <i className="fa-solid fa-eye mr-2"></i> {currentT.preview}
               </button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Chat Bot */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/30 backdrop-blur-sm flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-sparkles text-orange-500"></i> {currentT.chat}
            </h3>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar" ref={scrollRef}>
             <div className="flex flex-col gap-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5">
                       {msg.role === 'user' ? (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">User</span>
                       ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">{msg.modelName}</span>
                            {msg.latency && <span className="text-[10px] text-gray-300 font-mono">- {msg.latency}</span>}
                          </div>
                       )}
                    </div>
                    <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-gray-800' : 'text-gray-600'}`}>
                       {renderMessageContent(msg.text)}
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="animate-pulse flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">AI</span>
                    </div>
                    <div className="text-xs text-gray-400">Thinking...</div>
                  </div>
                )}
             </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-white">
             {attachedFiles.length > 0 && (
                <div className="flex gap-3 mb-2 overflow-x-auto p-3 -ml-3 -mr-3 custom-scrollbar">
                   {attachedFiles.map((file, i) => (
                     <div key={i} className="relative shrink-0 group">
                        {file.type.startsWith('image/') ? (
                           <img src={URL.createObjectURL(file)} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                           <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                             <i className="fa-solid fa-file text-xs"></i>
                           </div>
                        )}
                        <button onClick={() => removeAttachment(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-500 transition-colors">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                     </div>
                   ))}
                </div>
             )}

             <form onSubmit={handleChatSubmit} className="relative bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(e); } }}
                  placeholder={currentT.chatPlaceholder}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 min-h-[50px] max-h-[150px] resize-none text-gray-800 placeholder-gray-400"
                  rows={1}
                />
                
                <div className="flex items-center justify-between px-2 pb-2">
                   <div className="flex gap-1">
                      {supportsImages && (
                        <>
                          <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors">
                            <i className="fa-regular fa-image"></i>
                          </button>
                          <input type="file" ref={imageInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleAttachments(e.target.files)} />
                        </>
                      )}
                      {supportsFiles && (
                         <>
                           <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors">
                             <i className="fa-solid fa-paperclip"></i>
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.js,.ts,.html,.css,.json,.md" multiple onChange={(e) => handleAttachments(e.target.files)} />
                         </>
                      )}
                   </div>
                   
                   <button type="submit" disabled={!chatMessage.trim() && attachedFiles.length === 0} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${(!chatMessage.trim() && attachedFiles.length === 0) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                     <i className="fa-solid fa-arrow-up text-sm"></i>
                   </button>
                </div>
             </form>
          </div>
        </div>

        {/* MIDDLE: File Explorer - Removed hidden md:flex to keep it visible */}
        <div className="w-64 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
          <FileExplorer 
            files={project.files} 
            onFileSelect={(f) => { if (f) { setSelectedFileId(f.id); setActiveTab('editor'); } else { setSelectedFileId(null); } }} 
            selectedFileId={selectedFileId}
            onCreate={handleCreateFile}
            onRename={handleRenameFile}
            onDelete={handleDeleteFile}
            onMove={handleMoveFile}
            onDownload={handleDownload}
            t={currentT}
          />
        </div>

        {/* RIGHT: Editor or Preview */}
        <div className="flex-1 overflow-hidden relative bg-gray-100">
           {activeTab === 'editor' ? (
             /* Added KEY to CodeEditor to force re-render when file ID changes, preventing stuck content */
             <CodeEditor key={selectedFileId} file={selectedFile} onContentChange={handleFileChange} />
           ) : (
             <div className="h-full w-full overflow-hidden bg-white">
                <Preview files={project.files} onBack={() => {}} /> 
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
