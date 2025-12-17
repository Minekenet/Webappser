

export enum AppState {
  IDLE = 'IDLE',
  BUILDING = 'BUILDING',
  PREVIEW = 'PREVIEW',
  WORKSPACE = 'WORKSPACE',
  ERROR = 'ERROR'
}

export type PageView = 'home' | 'terms' | 'privacy';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface TechStack {
  framework: 'HTML/JS' | 'React';
  styling: 'CSS' | 'Tailwind';
}

// Old schema types removed/deprecated in favor of direct file generation
export interface GeneratedFile {
  path: string; // e.g., "index.html" or "css/style.css"
  content: string;
}

export interface GeneratedSiteResponse {
  siteName: string;
  description: string;
  files: GeneratedFile[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  parentId?: string;
  lastModified?: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  files: ProjectFile[];
  techStack: TechStack;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelName?: string;
  latency?: string;
  timestamp: number;
}

export type AiProvider = 'google' | 'openrouter' | 'openai' | 'custom';

export interface AiPreset {
  id: string;
  name: string;
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  capabilities?: {
    image?: boolean;
    file?: boolean;
  };
}

export interface AiConfig extends AiPreset {}

export const DEFAULT_PRESET: AiPreset = {
  id: 'default_gemini',
  name: 'Gemini Flash (Default)',
  provider: 'google',
  apiKey: process.env.API_KEY || '',
  baseUrl: '',
  model: 'gemini-2.5-flash',
  capabilities: {
    image: true,
    file: true
  }
};

export const DEFAULT_AI_CONFIG: AiConfig = DEFAULT_PRESET;

export type Language = 'en' | 'ru' | 'zh' | 'es' | 'ja';

// New types for Chat Editing
export interface EditAction {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
}

export interface AiEditResponse {
  explanation: string;
  actions: EditAction[];
}

export interface Translation {
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  inputPlaceholder: string;
  connectAi: string;
  using: string;
  aiNotConnected: string;
  surpriseMe: string;
  generate: string;
  building: string;
  uploadImage: string;
  uploadFile: string;
  stack: string;
  signIn: string;
  signOut: string;
  editProfile: string;
  aiSettings: string;
  cookiesTitle: string;
  cookiesText: string;
  cookiesNecessary: string;
  cookiesAll: string;
  onboardingWelcome: string;
  onboardingDesc1: string;
  onboardingPower: string;
  onboardingDesc2: string;
  fullName: string;
  email: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  needKey: string;
  back: string;
  continue: string;
  startCoding: string;
  savePreset: string;
  cancel: string;
  profileEdit: string;
  saveChanges: string;
  welcomeBack: string;
  createAccount: string;
  enterDetails: string;
  joinRev: string;
  password: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  designing: string;
  failed: string;
  manageModels: string;
  agreeTo: string;
  termsOfService: string;
  privacyPolicy: string;
  and: string;
  legalTitle: string;
  lastUpdated: string;
  errorEmail: string;
  errorPassword: string;
  errorTerms: string;
  errorName: string;
  myProjects: string;
  newProject: string;
  noProjects: string;
  recent: string;
  presets: string;
  addPreset: string;
  presetName: string;
  deletePreset: string;
  activate: string;
  active: string;
  confirmDelete: string;
  deleteTitle: string;
  deleteDesc: string;
  confirm: string;
  capabilities: string;
  supportsImage: string;
  supportsFile: string;
  editor: string;
  preview: string;
  files: string;
  chat: string;
  chatPlaceholder: string;
  sendMessage: string;
  projectFiles: string;
  downloadCode: string;
  root: string;
}