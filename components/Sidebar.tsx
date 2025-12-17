
import React, { useState } from 'react';
import { User, Translation, Project } from '../types';

interface SidebarProps {
  user: User | null;
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (p: Project) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  t: Translation;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, projects, currentProjectId, onSelectProject, onNewProject, onDeleteProject, t }) => {
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  if (!user) return null;

  return (
    <>
      <div className="fixed left-0 top-24 bottom-8 w-64 bg-white/90 backdrop-blur-xl border-r border-y border-r-gray-100 border-y-gray-100/50 rounded-r-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 flex flex-col transform transition-transform animate-slide-right">
        
        {/* Header */}
        <div className="p-6 pb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.myProjects}</h3>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {projects.length > 0 ? (
            <>
              {projects.map((p) => (
                <div key={p.id} className="relative group">
                  <button 
                    onClick={() => onSelectProject(p)}
                    className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                      currentProjectId === p.id ? 'bg-orange-50 ring-1 ring-orange-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      currentProjectId === p.id ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                      <i className="fa-solid fa-cube"></i>
                    </div>
                    <div className="overflow-hidden pr-6">
                      <div className={`text-sm font-semibold truncate ${currentProjectId === p.id ? 'text-gray-900' : 'text-gray-700'}`}>{p.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {new Date(p.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setProjectToDelete(p.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Project"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4 opacity-50">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <i className="fa-solid fa-folder-open text-gray-300"></i>
              </div>
              <p className="text-sm text-gray-500 font-medium">{t.noProjects}</p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideRight {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-right {
            animation: slideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setProjectToDelete(null)}></div>
           <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full relative z-10 animate-fade-in">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
               <i className="fa-solid fa-triangle-exclamation text-xl"></i>
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Delete Project?</h3>
             <p className="text-sm text-gray-500 mb-6 text-center">Are you sure you want to delete this project? This cannot be undone.</p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setProjectToDelete(null)}
                 className="flex-1 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => { onDeleteProject(projectToDelete); setProjectToDelete(null); }}
                 className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
               >
                 Delete
               </button>
             </div>
           </div>
        </div>
      )}
    </>
  );
};
