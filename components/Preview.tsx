
import React, { useEffect, useRef, useState } from 'react';
import { ProjectFile } from '../types';

interface PreviewProps {
  files: ProjectFile[];
  onBack: () => void;
}

export const Preview: React.FC<PreviewProps> = ({ files, onBack }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // Force re-render

  // Helper to resolve full path of a file
  const getFullPath = (file: ProjectFile, allFiles: ProjectFile[]): string => {
    if (!file.parentId) return file.name;
    const parent = allFiles.find(f => f.id === file.parentId);
    if (!parent) return file.name;
    return `${getFullPath(parent, allFiles)}/${file.name}`;
  };

  const getMimeType = (filename: string) => {
    if (filename.endsWith('.html')) return 'text/html';
    if (filename.endsWith('.css')) return 'text/css';
    if (filename.endsWith('.js')) return 'application/javascript';
    if (filename.endsWith('.json')) return 'application/json';
    if (filename.endsWith('.png')) return 'image/png';
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
    if (filename.endsWith('.svg')) return 'image/svg+xml';
    return 'text/plain';
  };

  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    
    // 1. Create a map of Path -> BlobURL
    const urlMap: Record<string, string> = {};
    const createdUrls: string[] = [];

    files.filter(f => f.type === 'file').forEach(file => {
      const fullPath = getFullPath(file, files);
      const blob = new Blob([file.content || ''], { type: getMimeType(file.name) });
      const url = URL.createObjectURL(blob);
      
      urlMap[fullPath] = url;
      createdUrls.push(url);
      
      // Also map just the filename for simple flat-directory matches if path fails
      if (fullPath !== file.name) {
         urlMap[file.name] = url;
      }
    });

    // 2. Find Index HTML
    const indexFile = files.find(f => f.name.toLowerCase() === 'index.html');
    
    if (!indexFile) {
       const doc = iframe.contentDocument;
       if(doc) {
         doc.open();
         doc.write(`<div style="font-family:sans-serif; padding: 20px; color: #666;">
            <h1>No index.html found</h1>
            <p>Please create an index.html file to preview your project.</p>
            <h3>Available files:</h3>
            <ul>${files.filter(f => f.type === 'file').map(f => `<li>${f.name}</li>`).join('')}</ul>
         </div>`);
         doc.close();
       }
       return;
    }

    // 3. Process HTML to replace relative links with Blob URLs
    let processedHtml = indexFile.content || '';

    // We need to replace src="..." and href="..."
    // This regex looks for src/href attributes and captures the value
    // It is naive but works for 90% of generated cases.
    processedHtml = processedHtml.replace(/(src|href)=["']([^"']+)["']/g, (match, attr, path) => {
        // Remove leading ./ or /
        const cleanPath = path.replace(/^(\.\/|\/)/, '');
        
        if (urlMap[cleanPath]) {
            return `${attr}="${urlMap[cleanPath]}"`;
        }
        return match; // Return original if not found (external links)
    });

    // 4. Inject into Iframe
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(processedHtml);
      doc.close();
    }

    // Cleanup URLs on unmount/re-render
    return () => {
        createdUrls.forEach(url => URL.revokeObjectURL(url));
    };

  }, [files, key]);

  return (
    <div className="h-full w-full bg-white relative">
      <div className="absolute top-2 right-4 z-10 flex gap-2">
         <button onClick={() => setKey(k => k+1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors shadow-sm" title="Refresh">
           <i className="fa-solid fa-rotate-right"></i>
         </button>
      </div>
      <iframe 
        key={key}
        ref={iframeRef}
        title="Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
      />
    </div>
  );
};
