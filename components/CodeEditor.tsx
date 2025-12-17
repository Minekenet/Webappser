
import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../types';

// Declare global hljs
declare const hljs: any;

interface CodeEditorProps {
  file: ProjectFile | null;
  onContentChange: (content: string) => void;
}

// Basic auto-formatter for "One Line" HTML/CSS
const autoFormat = (code: string, type: string): string => {
    const lines = code.split('\n');
    if (lines.length > Math.max(5, code.length / 100)) return code;

    let formatted = '';
    let indent = 0;
    
    const chars = code.split('');
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        
        if (char === '<' && chars[i+1] !== '/') { 
            formatted += '\n' + '  '.repeat(indent) + char;
            indent++;
        } else if (char === '<' && chars[i+1] === '/') {
             indent = Math.max(0, indent - 1);
             formatted += '\n' + '  '.repeat(indent) + char;
        } else if (char === '>') {
             formatted += char;
        } else if (char === ';') {
             formatted += char + '\n' + '  '.repeat(indent);
        } else if (char === '{') {
             formatted += ' {\n';
             indent++;
             formatted += '  '.repeat(indent);
        } else if (char === '}') {
             indent = Math.max(0, indent - 1);
             formatted += '\n' + '  '.repeat(indent) + '}';
        } else {
             formatted += char;
        }
    }
    return formatted.replace(/\n\s*\n/g, '\n').trim();
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onContentChange }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // When file changes
  useEffect(() => {
    if (file) {
      let initialContent = file.content || '';
      if (initialContent.length > 200 && initialContent.split('\n').length < 3) {
         initialContent = autoFormat(initialContent, file.language || 'txt');
         onContentChange(initialContent);
      }
      setContent(initialContent);
      setLineCount(initialContent.split('\n').length);
    } else {
        setContent('');
        setLineCount(1);
    }
  }, [file?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setLineCount(val.split('\n').length);
    onContentChange(val);
  };
  
  // Sync scroll between textarea, pre/code block, and line numbers
  const handleScroll = () => {
      if (textareaRef.current) {
          const scrollTop = textareaRef.current.scrollTop;
          const scrollLeft = textareaRef.current.scrollLeft;
          
          if (preRef.current) {
              preRef.current.scrollTop = scrollTop;
              preRef.current.scrollLeft = scrollLeft;
          }
          const lineNums = document.getElementById('line-numbers');
          if (lineNums) lineNums.scrollTop = scrollTop;
      }
  };

  // Escape HTML for the pre block to render correctly
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Render Highlighted Code
  const renderHighlightedCode = () => {
    if (!content) return '';
    if (typeof hljs !== 'undefined' && file?.language) {
      try {
        // Map common extensions to hljs languages
        let lang = file.language;
        if (lang === 'js' || lang === 'jsx' || lang === 'ts' || lang === 'tsx') lang = 'javascript';
        if (lang === 'html') lang = 'xml';
        
        if (hljs.getLanguage(lang)) {
            return hljs.highlight(content, { language: lang }).value;
        }
      } catch (e) {
        // Fallback
      }
    }
    return escapeHtml(content);
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-[#1e1e1e]">
        <div className="w-20 h-20 mb-4 bg-[#252526] rounded-full flex items-center justify-center">
             <i className="fa-solid fa-code text-4xl opacity-50"></i>
        </div>
        <p className="font-mono text-sm">Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] select-none h-10 shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono">
           <i className="fa-solid fa-file text-blue-400"></i>
           <span className="text-[#cccccc] font-bold">{file.name}</span>
           {file.content !== content && <div className="w-2 h-2 rounded-full bg-white ml-1"></div>}
        </div>
        <div className="flex gap-2">
             <button 
                onClick={() => {
                    const formatted = autoFormat(content, file.language || 'txt');
                    setContent(formatted);
                    setLineCount(formatted.split('\n').length);
                    onContentChange(formatted);
                }}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 hover:bg-[#3e3e42] rounded transition-colors"
                title="Format Document"
             >
                 <i className="fa-solid fa-align-left mr-1"></i> Format
             </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-[14px] leading-[21px]">
        {/* Line Numbers */}
        <div 
            id="line-numbers"
            className="w-12 shrink-0 bg-[#1e1e1e] text-[#858585] text-right pr-4 pt-4 select-none overflow-hidden border-r border-[#3e3e42]"
            style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" }}
        >
            {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
            ))}
        </div>

        {/* Editing Area (Overlay method) */}
        <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
            {/* 1. Background Highlight Layer */}
            <pre
                ref={preRef}
                className="absolute inset-0 m-0 p-4 pl-2 pointer-events-none whitespace-pre overflow-hidden"
                style={{ 
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", 
                    tabSize: 2,
                }}
            >
                <code 
                    className={`language-${file.language === 'html' ? 'xml' : file.language} hljs`}
                    style={{ background: 'transparent', padding: 0 }}
                    dangerouslySetInnerHTML={{ __html: renderHighlightedCode() + '<br/>' }} 
                />
            </pre>

            {/* 2. Foreground Input Layer */}
            <textarea
                ref={textareaRef}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent p-4 pl-2 outline-none resize-none whitespace-pre custom-scrollbar caret-white"
                style={{ 
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", 
                    tabSize: 2,
                    color: 'transparent',
                }}
                value={content}
                onChange={handleChange}
                onScroll={handleScroll}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
            />
        </div>
      </div>
    </div>
  );
};
