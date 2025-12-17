
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedSiteResponse, TechStack, AiConfig, ProjectFile, AiEditResponse, EditAction } from "../types";

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const getFullPath = (file: ProjectFile, allFiles: ProjectFile[]): string => {
  if (!file.parentId) return file.name;
  const parent = allFiles.find(f => f.id === file.parentId);
  if (!parent) return file.name;
  return `${getFullPath(parent, allFiles)}/${file.name}`;
};

const FILES_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    siteName: { type: Type.STRING },
    description: { type: Type.STRING },
    files: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["path", "content"]
      }
    }
  },
  required: ["siteName", "description", "files"]
};

const EDIT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: { 
      type: Type.STRING, 
      description: "A helpful explanation of changes for the user." 
    },
    actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["create", "update", "delete"] },
          path: { type: Type.STRING, description: "Relative path (e.g. css/style.css)" },
          content: { type: Type.STRING, description: "New content for create/update" }
        },
        required: ["type", "path"]
      }
    }
  },
  required: ["explanation", "actions"]
};

export const generateWebsiteConfig = async (
  prompt: string,
  techStack: TechStack,
  aiConfig: AiConfig,
  files: File[] = [],
  language: string = 'en'
): Promise<GeneratedSiteResponse> => {
  
  const { provider, apiKey, baseUrl, model } = aiConfig;
  let cleanApiKey = apiKey ? apiKey.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^\x00-\x7F]/g, '') : '';
  if (!cleanApiKey && provider === 'google') cleanApiKey = process.env.API_KEY || '';

  if (!cleanApiKey) throw new Error("API Key is missing.");

  let stackInstructions = "";
  if (techStack.framework === 'React') {
    stackInstructions = `
      - Use React via ES Modules (CDN). 
      - In index.html, import React, ReactDOM, and Babel from a CDN.
      - Use <script type="text/babel" data-type="module">.
      - Structure: index.html (entry), styles.css.
    `;
  } else {
    stackInstructions = `
      - Use HTML5, CSS, and Vanilla JS.
      - Separate index.html, css/style.css, js/script.js.
    `;
  }

  if (techStack.styling === 'Tailwind') {
    stackInstructions += `\n- Use Tailwind CSS via CDN.`;
  }

  const systemInstruction = `
    You are a Senior Frontend Engineer. 
    Task: Generate SOURCE CODE for a website.
    Stack: ${techStack.framework} + ${techStack.styling}.
    Language Setting: The user speaks ${language}. Ensure the 'description' field is in ${language}, and any content inside the website (text, labels) is in ${language} unless requested otherwise.
    ${stackInstructions}
    
    IMPORTANT FORMATTING RULES:
    1. **DO NOT MINIFY THE CODE.**
    2. Use 2 spaces for indentation.
    3. Include proper line breaks and whitespace.
    4. The output must be human-readable and formatted.
    
    Return JSON with file paths and full source code.
  `;

  const processedParts: any[] = [];
  let attachedTextContext = "";

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const b64WithPrefix = await fileToGenerativePart(file);
      const b64Data = b64WithPrefix.split(',')[1];
      processedParts.push({ inlineData: { data: b64Data, mimeType: file.type } });
    } else {
      const textContent = await fileToText(file);
      attachedTextContext += `\nFile ${file.name}:\n${textContent}\n`;
    }
  }

  const finalPrompt = `${prompt}\n${attachedTextContext}`;

  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey: cleanApiKey });
    const parts = [...processedParts, { text: finalPrompt }];

    try {
      const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: { parts: parts },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: FILES_SCHEMA,
        }
      });
      if (!response.text) throw new Error("No response");
      return JSON.parse(response.text) as GeneratedSiteResponse;
    } catch (error) {
      console.error(error);
      throw error;
    }
  } else {
    throw new Error("Only Google Provider currently supported for deep file generation in this demo.");
  }
};

export const editProjectCode = async (
  currentFiles: ProjectFile[],
  userPrompt: string,
  attachedFiles: File[],
  aiConfig: AiConfig,
  languageCode: string = 'en'
): Promise<AiEditResponse> => {
  const { provider, apiKey, model } = aiConfig;
  let cleanApiKey = apiKey ? apiKey.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^\x00-\x7F]/g, '') : '';
  if (!cleanApiKey && provider === 'google') cleanApiKey = process.env.API_KEY || '';

  if (!cleanApiKey) throw new Error("API Key is missing.");

  let fileContext = "CURRENT PROJECT STRUCTURE AND CONTENT:\n";
  const textFiles = currentFiles.filter(f => f.type === 'file');
  for (const f of textFiles) {
    const path = getFullPath(f, currentFiles);
    fileContext += `\n--- START FILE: ${path} ---\n${f.content}\n--- END FILE: ${path} ---\n`;
  }

  let userFilesContext = "";
  const parts: any[] = [];
  
  for (const file of attachedFiles) {
    if (file.type.startsWith('image/')) {
      const b64WithPrefix = await fileToGenerativePart(file);
      const b64Data = b64WithPrefix.split(',')[1];
      parts.push({ inlineData: { data: b64Data, mimeType: file.type } });
    } else {
      const txt = await fileToText(file);
      userFilesContext += `\nUser Attached File ${file.name}:\n${txt}\n`;
    }
  }

  const systemInstruction = `
    You are an expert coding assistant.
    You will receive the current file structure of a web project.
    Your task is to modify the project based on the user's request.
    
    IMPORTANT:
    1. Respond in JSON format only.
    2. 'explanation': A message to the user describing what you did (IN LANGUAGE: ${languageCode}).
    3. 'actions': An array of changes.
       - 'create': Add a new file. Path and Content required.
       - 'update': Change existing file. Path and Content required (FULL CONTENT).
       - 'delete': Remove a file. Path required.
    4. Maintain the existing architectural style.
    5. The user's language is ${languageCode}. Ensure all explanations are in ${languageCode}.
    6. **DO NOT MINIFY CODE**. Use standard indentation and line breaks.
  `;

  const finalPrompt = `${fileContext}\n\nUSER REQUEST: ${userPrompt}\n${userFilesContext}`;
  parts.push({ text: finalPrompt });

  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: EDIT_SCHEMA,
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text) as AiEditResponse;

  } catch (error) {
    console.error("Edit Project Error:", error);
    throw error;
  }
};
