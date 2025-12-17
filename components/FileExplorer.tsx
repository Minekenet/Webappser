
import React, { useState } from 'react';
import { ProjectFile, Translation } from '../types';

interface FileExplorerProps {
  files: ProjectFile[];
  onFileSelect: (file: ProjectFile | null) => void;
  selectedFileId: string | null;
  onCreate: (name: string, type: 'file' | 'folder', parentId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newParentId: string | null) => void;
  onDownload: () => void;
  t: Translation;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onFileSelect, 
  selectedFileId, 
  onCreate, 
  onRename, 
  onDelete, 
  onMove, 
  onDownload,
  t 
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  
  // Creation State
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Rename State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Drag and Drop State
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(collapsedFolders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCollapsedFolders(newSet);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && creatingType) {
      onCreate(newItemName.trim(), creatingType, creatingInFolderId);
    }
    setCreatingType(null);
    setNewItemName('');
    setCreatingInFolderId(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && renamingId) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const startCreating = (type: 'file' | 'folder') => {
    const selected = files.find(f => f.id === selectedFileId);
    const parentId = (selected && selected.type === 'folder') ? selected.id : (selected ? selected.parentId || null : null);
    
    setCreatingInFolderId(parentId);
    setCreatingType(type);
    setNewItemName('');
    if (parentId) {
      const newSet = new Set(collapsedFolders);
      newSet.delete(parentId);
      setCollapsedFolders(newSet);
    }
  };

  // --- Robust Drag & Drop Handlers ---
  
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ fileId }));
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image
    // e.dataTransfer.setDragImage(e.currentTarget, 0, 0); 
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault(); // Essential for dropping
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // Only highlight if it's different
    setDragOverFolderId(folderId || 'root');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Logic to avoid flickering when entering children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverFolderId(null); 
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data && data.fileId) {
            const fileId = data.fileId;
            // Prevent self-drop
            if (fileId === targetFolderId) return;
            // Additional recursion checks are done in Workspace
            onMove(fileId, targetFolderId);
        }
    } catch(err) {
        console.error("Drop failed", err);
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
      e.preventDefault();
      handleDrop(e, null);
  };

  // --- Recursive Tree Component ---
  const FileTree = ({ parentId, depth = 0 }: { parentId: string | null, depth?: number }) => {
    const children = files.filter(f => (f.parentId || null) === parentId);
    
    children.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });

    return (
      <div className="flex flex-col">
        {children.map(file => {
          const isFolder = file.type === 'folder';
          const isCollapsed = collapsedFolders.has(file.id);
          const isSelected = selectedFileId === file.id;
          const isRenaming = renamingId === file.id;
          const isDragTarget = isFolder && dragOverFolderId === file.id;

          return (
            <div key={file.id}>
              {/* File Row */}
              <div 
                draggable={!isRenaming}
                onDragStart={(e) => handleDragStart(e, file.id)}
                onDragOver={(e) => isFolder ? handleDragOver(e, file.id) : undefined}
                onDragLeave={(e) => isFolder ? handleDragLeave(e) : undefined}
                onDrop={(e) => isFolder ? handleDrop(e, file.id) : undefined}
                className={`
                   group relative flex items-center justify-between px-2 py-1.5 cursor-pointer text-sm transition-all border-l-2
                   ${isSelected ? 'bg-orange-50 text-orange-700 border-orange-500 font-medium' : 'text-gray-700 border-transparent hover:bg-gray-100'}
                   ${isDragTarget ? 'bg-blue-100 border-blue-500 shadow-inner' : ''}
                `}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    if(isFolder) toggleFolder(file.id, e);
                    else onFileSelect(file);
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
                   {isFolder ? (
                      <i className={`fa-solid ${isCollapsed ? 'fa-folder' : 'fa-folder-open'} text-yellow-400 w-4 transition-transform duration-200`}></i>
                   ) : (
                      <i className={`w-4 text-center ${getFileIcon(file.name)}`}></i>
                   )}

                   {isRenaming ? (
                     <div className="pointer-events-auto flex-1">
                        <form onSubmit={handleRenameSubmit} onClick={e => e.stopPropagation()}>
                           <input 
                              type="text" 
                              value={renameValue} 
                              onChange={e => setRenameValue(e.target.value)} 
                              autoFocus 
                              onBlur={handleRenameSubmit}
                              className="w-full bg-white border border-blue-300 rounded px-1 py-0.5 text-xs outline-none"
                           />
                        </form>
                     </div>
                   ) : (
                     <span className="truncate select-none">{file.name}</span>
                   )}
                </div>

                {!isRenaming && (
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-inherit z-10">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setRenamingId(file.id); setRenameValue(file.name); }}
                       className="text-gray-400 hover:text-blue-500 p-1 hover:bg-gray-200 rounded" title="Rename"
                     >
                       <i className="fa-solid fa-pen text-xs"></i>
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); if(confirm('Delete ' + file.name + '?')) onDelete(file.id); }}
                       className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-200 rounded" title="Delete"
                     >
                       <i className="fa-solid fa-trash text-xs"></i>
                     </button>
                   </div>
                )}
              </div>

              {isFolder && !isCollapsed && (
                 <FileTree parentId={file.id} depth={depth + 1} />
              )}
            </div>
          );
        })}

        {creatingType && creatingInFolderId === parentId && (
           <div className="px-2 py-1.5" style={{ paddingLeft: `${depth * 16 + 12}px` }}>
              <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
                 <i className={`fa-solid ${creatingType === 'folder' ? 'fa-folder text-yellow-400' : 'fa-file text-gray-400'} w-4`}></i>
                 <input 
                   type="text" 
                   value={newItemName} 
                   onChange={e => setNewItemName(e.target.value)} 
                   autoFocus 
                   onBlur={handleCreateSubmit}
                   placeholder={`Name...`}
                   className="w-full bg-white border border-blue-300 rounded px-1 py-0.5 text-xs outline-none"
                 />
              </form>
           </div>
        )}
      </div>
    );
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return 'fa-brands fa-html5 text-orange-500';
    if (name.endsWith('.css')) return 'fa-brands fa-css3-alt text-blue-500';
    if (name.endsWith('.js') || name.endsWith('.ts')) return 'fa-brands fa-js text-yellow-500';
    if (name.endsWith('.json')) return 'fa-solid fa-code text-green-600';
    if (name.endsWith('.md')) return 'fa-solid fa-info-circle text-gray-400';
    return 'fa-solid fa-file-lines text-gray-400';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 relative">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 z-10">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.projectFiles}</h3>
        <div className="flex gap-2">
           <button onClick={() => startCreating('file')} className="text-gray-400 hover:text-gray-700 transition-colors" title="New File"><i className="fa-solid fa-file-circle-plus"></i></button>
           <button onClick={() => startCreating('folder')} className="text-gray-400 hover:text-gray-700 transition-colors" title="New Folder"><i className="fa-solid fa-folder-plus"></i></button>
        </div>
      </div>
      
      <div 
           className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 pb-4 relative transition-colors"
           onDragOver={(e) => handleDragOver(e, null)}
           onDrop={(e) => handleRootDrop(e)}
           onDragLeave={handleDragLeave}
      >
        <div 
            className={`py-2 min-h-full ${dragOverFolderId === 'root' ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : ''}`} 
            onClick={() => { setCreatingInFolderId(null); onFileSelect(null); }}
        >
          <FileTree parentId={null} />
        </div>
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-white shrink-0 z-10">
        <button 
          onClick={onDownload}
          className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
        >
          <i className="fa-solid fa-download"></i>
          {t.downloadCode}
        </button>
      </div>
    </div>
  );
};
