
import React, { useState, useEffect } from 'react';
import { AppState, TechStack, GeneratedSiteResponse, AiConfig, DEFAULT_AI_CONFIG, User, Language, PageView, AiPreset, DEFAULT_PRESET, Project, ProjectFile } from './types';
import { translations } from './translations';
import { InputArea } from './components/InputArea';
import { ConfigPanel } from './components/ConfigPanel';
import { Workspace } from './components/Workspace';
import { Header } from './components/Header';
import { CookieBanner } from './components/CookieBanner';
import { Onboarding } from './components/Onboarding';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { LegalPage } from './components/LegalPage';
import { Sidebar } from './components/Sidebar';
import { generateWebsiteConfig } from './services/geminiService';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [prompt, setPrompt] = useState('');
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageView>('home');

  // Language State - Auto-detect from browser if no local storage
  const [language, setLanguage] = useState<Language>(() => {
    try {
        const savedLang = localStorage.getItem('vibe_coder_lang') as Language;
        if (savedLang && ['en', 'ru', 'zh', 'es', 'ja'].includes(savedLang)) return savedLang;
        
        const browserLang = navigator.language.split('-')[0] as Language;
        if (['en', 'ru', 'zh', 'es', 'ja'].includes(browserLang)) return browserLang;
        
        return 'en';
    } catch {
        return 'en';
    }
  });
  
  const t = translations[language];

  // User & Auth State
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Configuration
  const [techStack, setTechStack] = useState<TechStack>({
    framework: 'HTML/JS',
    styling: 'Tailwind'
  });
  
  // AI Config & Presets
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [presets, setPresets] = useState<AiPreset[]>([DEFAULT_PRESET]);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  // Initialization
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('vibe_coder_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (!parsedConfig.apiKey && process.env.API_KEY && parsedConfig.provider === 'google') {
           parsedConfig.apiKey = process.env.API_KEY;
        }
        setAiConfig(parsedConfig);
      }
      
      const savedPresets = localStorage.getItem('vibe_coder_presets');
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets);
        const updatedPresets = parsedPresets.map((p: AiPreset) => {
           if (!p.apiKey && process.env.API_KEY && p.provider === 'google') {
             return { ...p, apiKey: process.env.API_KEY };
           }
           return p;
        });
        setPresets(updatedPresets);
      } else {
        setPresets([DEFAULT_PRESET]);
      }

      const savedUser = localStorage.getItem('vibe_coder_user');
      if (savedUser) setUser(JSON.parse(savedUser));

      const onboarded = localStorage.getItem('vibe_coder_onboarded');
      setHasCompletedOnboarding(!!onboarded);

      const savedProjects = localStorage.getItem('vibe_coder_projects');
      if (savedProjects) setProjects(JSON.parse(savedProjects));

    } catch (e) {
      console.error("Failed to load local storage", e);
    }
  }, []);

  // Persist projects whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('vibe_coder_projects', JSON.stringify(projects));
    } else {
      localStorage.setItem('vibe_coder_projects', JSON.stringify([]));
    }
  }, [projects]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('vibe_coder_lang', lang);
  };

  const handleAiConfigChange = (newActiveConfig: AiConfig, updatedPresets: AiPreset[]) => {
    setAiConfig(newActiveConfig);
    localStorage.setItem('vibe_coder_config', JSON.stringify(newActiveConfig));
    setPresets(updatedPresets);
    localStorage.setItem('vibe_coder_presets', JSON.stringify(updatedPresets));
  };

  const handleUserLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('vibe_coder_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vibe_coder_user');
    const clearedConfig = { ...DEFAULT_AI_CONFIG, apiKey: '' };
    setAiConfig(clearedConfig);
    localStorage.removeItem('vibe_coder_config');
    setAppState(AppState.IDLE);
    setCurrentProjectId(null);
  };

  const handleOnboardingComplete = (newUser: User, newConfig: AiConfig) => {
    handleUserLogin(newUser);
    const newPreset: AiPreset = {
       ...newConfig,
       id: 'preset_' + Date.now(),
       name: 'My First Preset'
    };
    const newPresetsList = [newPreset];
    setPresets(newPresetsList);
    setAiConfig(newPreset);
    localStorage.setItem('vibe_coder_onboarded', 'true');
    localStorage.setItem('vibe_coder_config', JSON.stringify(newPreset));
    localStorage.setItem('vibe_coder_presets', JSON.stringify(newPresetsList));
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const handleSwitchToRegister = () => {
    setShowAuthModal(false);
    setShowOnboarding(true);
  };

  const handleSwitchToLogin = () => {
    setShowOnboarding(false);
    setShowAuthModal(true);
  };

  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowOnboarding(true);
    } else {
      action();
    }
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createFileStructure = (files: {path: string, content: string}[]): ProjectFile[] => {
    const projectFiles: ProjectFile[] = [];
    const folderMap = new Map<string, string>(); 

    files.sort((a, b) => a.path.length - b.path.length);

    files.forEach(f => {
       const parts = f.path.split('/');
       const fileName = parts.pop()!;
       const folderPath = parts.join('/');
       
       let parentId: string | undefined = undefined;
       
       if (folderPath) {
          let currentPath = '';
          let lastParentId: string | undefined = undefined;

          parts.forEach(part => {
             currentPath = currentPath ? `${currentPath}/${part}` : part;
             if (!folderMap.has(currentPath)) {
                const newFolderId = 'folder_' + Math.random().toString(36).substr(2, 9);
                projectFiles.push({
                   id: newFolderId,
                   name: part,
                   type: 'folder',
                   parentId: lastParentId
                });
                folderMap.set(currentPath, newFolderId);
                lastParentId = newFolderId;
             } else {
                lastParentId = folderMap.get(currentPath);
             }
          });
          parentId = lastParentId;
       }

       projectFiles.push({
         id: 'file_' + Math.random().toString(36).substr(2, 9),
         name: fileName,
         type: 'file',
         content: f.content,
         language: fileName.split('.').pop() || 'txt',
         parentId: parentId
       });
    });

    return projectFiles;
  };

  // --- LANGUAGE DETECTION ---
  const detectLanguage = (text: string): Language => {
    const cyrillicPattern = /[а-яА-ЯЁё]/;
    const chinesePattern = /[\u4e00-\u9fa5]/;
    const spanishPattern = /[áéíóúñ¡¿]/;
    const japanesePattern = /[\u3040-\u30ff\u31f0-\u31ff]/;

    if (cyrillicPattern.test(text)) return 'ru';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (spanishPattern.test(text)) return 'es';
    
    return 'en'; // Default
  };

  const handleBuild = async (files: File[] = []) => {
    const effectiveKey = aiConfig.apiKey || process.env.API_KEY || '';

    if (!effectiveKey) {
      setShowSettingsModal(true);
      return;
    }

    // Detect language from prompt and update state
    const detectedLang = detectLanguage(prompt);
    // Automatically update global language if detected
    if (detectedLang !== language) {
        setLanguage(detectedLang);
        localStorage.setItem('vibe_coder_lang', detectedLang);
    }

    setAppState(AppState.BUILDING);
    setErrorMsg(null);
    try {
      // Use detectedLang or current language
      const generatedResponse = await generateWebsiteConfig(prompt, techStack, aiConfig, files, detectedLang);
      
      const projectFiles = createFileStructure(generatedResponse.files);
      
      if (!projectFiles.some(f => f.name.toLowerCase() === 'readme.md')) {
        projectFiles.push({
          id: 'file_readme_' + Date.now(),
          name: 'README.md',
          type: 'file',
          content: `# ${generatedResponse.siteName}\n\n${generatedResponse.description}\n\nGenerated with Webappser.\nStack: ${techStack.framework} + ${techStack.styling}`,
          language: 'markdown'
        });
      }

      const newProject: Project = {
        id: 'proj_' + Date.now(),
        name: generatedResponse.siteName || 'New Project',
        createdAt: Date.now(),
        lastModified: Date.now(),
        files: projectFiles,
        techStack: techStack
      };

      setProjects(prev => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
      setAppState(AppState.WORKSPACE);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong while generating the site.");
      setAppState(AppState.ERROR);
    }
  };

  const handleBackToEditor = () => {
    setAppState(AppState.IDLE);
    setCurrentProjectId(null);
  };

  const handleOpenProject = (p: Project) => {
    setCurrentProjectId(p.id);
    setAppState(AppState.WORKSPACE);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProjectId === projectId) {
      setAppState(AppState.IDLE);
      setCurrentProjectId(null);
    }
  };

  if (currentPage === 'terms') {
    return <LegalPage type="terms" onBack={() => setCurrentPage('home')} t={t} />;
  }

  if (currentPage === 'privacy') {
    return <LegalPage type="privacy" onBack={() => setCurrentPage('home')} t={t} />;
  }

  if (appState === AppState.WORKSPACE && currentProject) {
    return (
      <Workspace 
        project={currentProject} 
        onBack={handleBackToEditor} 
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        aiConfig={aiConfig}
        t={t}
        language={language} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col relative font-sans text-gray-900 selection:bg-orange-100">
      {/* ... (Existing modals remain unchanged) ... */}
      {showOnboarding && (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          onNavigate={(page) => { setShowOnboarding(false); setCurrentPage(page); }} 
          onClose={() => setShowOnboarding(false)}
          onSwitchToLogin={handleSwitchToLogin}
          t={t} 
        />
      )}
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleUserLogin} 
        onNavigate={(page) => { setShowAuthModal(false); setCurrentPage(page); }}
        onSwitchToRegister={handleSwitchToRegister}
        t={t} 
      />
      
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        config={aiConfig} 
        presets={presets}
        onSave={handleAiConfigChange} 
        t={t} 
      />

      {user && <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} onSave={handleUserLogin} t={t} />}

      <Header 
        user={user} 
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoginClick={() => setShowOnboarding(true)} 
        onSettingsClick={() => requireAuth(() => setShowSettingsModal(true))}
        onLogoutClick={handleLogout}
        onProfileClick={() => setShowProfileModal(true)}
        t={t}
      />
      
      <Sidebar 
        user={user} 
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleOpenProject}
        onNewProject={() => {
           setAppState(AppState.IDLE);
           setCurrentProjectId(null);
           setPrompt('');
        }}
        onDeleteProject={handleDeleteProject}
        t={t} 
      />

      <CookieBanner t={t} />

      {appState === AppState.BUILDING && (
        <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
           <div className="relative w-20 h-20 mb-8">
             <div className="absolute inset-0 border-t-2 border-black border-solid rounded-full animate-spin"></div>
             <div className="absolute inset-2 border-t-2 border-orange-500 border-solid rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
           </div>
           <h2 className="text-3xl font-light tracking-tight text-gray-900">{t.designing}</h2>
           <p className="text-gray-500 mt-2 text-sm font-medium uppercase tracking-widest">{t.using} {aiConfig.provider}</p>
        </div>
      )}

      {appState === AppState.ERROR && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white text-red-600 px-6 py-4 rounded-2xl shadow-xl border border-red-50 flex items-center gap-4 z-[60] w-[90%] max-w-lg animate-bounce-in">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
             <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{t.failed}</p>
            <p className="text-sm text-gray-500 mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setAppState(AppState.IDLE)} className="text-gray-400 hover:text-gray-900 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {appState === AppState.IDLE && (
        <main 
          className="flex-grow flex flex-col items-center justify-center p-4 relative z-10 pt-28 md:pt-32 transition-all duration-500 ease-in-out"
        >
          <div className="w-full max-w-3xl mb-10 text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-gray-100 backdrop-blur-sm text-xs font-medium text-gray-500 mb-2 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${aiConfig.apiKey || process.env.API_KEY ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></span>
                {t.heroBadge}
             </div>
             <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter">
               {t.heroTitle} <br className="hidden md:block" />
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-rose-600">websites instantly.</span>
             </h1>
             <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
               {t.heroSubtitle}
             </p>
          </div>

          <InputArea 
            prompt={prompt} 
            setPrompt={setPrompt} 
            aiConfig={{...aiConfig, apiKey: aiConfig.apiKey || process.env.API_KEY || ''}} 
            onOpenSettings={() => requireAuth(() => setShowSettingsModal(true))}
            onBuild={handleBuild}
            checkAuth={requireAuth}
            isLoading={false}
            t={t}
          />
          
          <ConfigPanel 
            techStack={techStack}
            setTechStack={setTechStack}
            disabled={false}
            t={t}
          />
        </main>
      )}
      
      <style>{`
        @keyframes bounceIn {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          50% { opacity: 1; transform: translate(-50%, 5px); }
          100% { transform: translate(-50%, 0); }
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}
