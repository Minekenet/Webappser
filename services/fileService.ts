
import JSZip from 'jszip';
import { ProjectFile } from '../types';

// Helper to construct full path for a file
const getFullPath = (file: ProjectFile, allFiles: ProjectFile[]): string => {
  if (!file.parentId) return file.name;
  
  const parent = allFiles.find(f => f.id === file.parentId);
  if (!parent) return file.name; // Fallback if parent not found
  
  return `${getFullPath(parent, allFiles)}/${file.name}`;
};

export const downloadProjectAsZip = async (projectName: string, files: ProjectFile[]) => {
  const zip = new JSZip();

  // Create folders first (optional but good for structure)
  files.filter(f => f.type === 'folder').forEach(folder => {
    const path = getFullPath(folder, files);
    zip.folder(path);
  });

  // Add files
  files.filter(f => f.type === 'file').forEach(file => {
    const path = getFullPath(file, files);
    zip.file(path, file.content || '');
  });

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
