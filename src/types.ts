export type RelationshipType = 
  | 'amistad' 
  | 'odio' 
  | 'amor' 
  | 'amor secreto' 
  | 'rivalidad' 
  | 'familia' 
  | 'lealtad' 
  | 'desconfianza'
  | 'mentor/aprendiz'
  | 'alianza secreta'
  | 'enemistad'
  | 'otro';

export interface CharacterRelation {
  id: string;
  targetCharacterId: string;
  relationshipType: string;
  notes?: string;
}

export interface Character {
  id: string;
  name: string;
  gender: string; // género: 'Femenino', 'Masculino', 'No binario', 'Otro'
  history: string; // historia y trasfondo del personaje
  role: 'protagonista' | 'antagonista' | 'secundario' | 'misterioso';
  archetype?: string;
  description?: string;
  traits?: string;
  secretsOrGoals?: string;
  relations: CharacterRelation[];
}

export interface WorldItem {
  id: string;
  name: string; // Nombre del mundo
  genre?: string;
  description?: string;
  worldRules: string; // Reglas del mundo
  forbiddenThings: string; // Cosas que no se pueden hacer en el mundo / cosas prohibidas
  characters: Character[];
  createdAt: string;
  updatedAt?: string;
}

export interface ChapterVersion {
  id: string;
  savedAt: string;
  title: string;
  content: string;
  wordCount: number;
  label?: string;
  rewriteNote?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  createdAt: string;
  userNoteTrigger?: string;
  wordCount: number;
  suggestions?: string[];
  history?: ChapterVersion[]; // Historial de las últimas 3 versiones
}

export interface StoryItem {
  id: string;
  worldId: string;
  title: string;
  description: string;
  involvedCharacterIds: string[];
  chapters: Chapter[];
  currentChapterIndex: number;
  createdAt: string;
  updatedAt: string;
}

export type ReaderTheme = 'onyx' | 'midnight' | 'espresso' | 'charcoal' | 'paper';
export type ReaderFont = 'serif' | 'sans' | 'mono';

export interface ReaderSettings {
  fontSize: number; // 15 to 26
  fontFamily: ReaderFont;
  theme: ReaderTheme;
  lineHeight: 'relaxed' | 'normal' | 'loose';
  maxWidth: 'narrow' | 'normal' | 'wide';
  autoTimeTheme: boolean;
}

export const getEffectiveReaderTheme = (settings?: ReaderSettings): ReaderTheme => {
  if (!settings) return 'onyx';
  if (settings.autoTimeTheme) {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 19) ? 'paper' : 'onyx';
  }
  return settings.theme || 'onyx';
};

export interface AppConfig {
  geminiApiKey: string;
  selectedModel: string;
  autoSave: boolean;
}

export interface UniverseLore {
  title: string;
  genre: string;
  synopsis: string;
  worldRules: string;
  factions: string;
  tone: string;
  keyLocations: string;
}

export interface WorldPreset {
  id: string;
  name: string;
  genre: string;
  universe: UniverseLore;
  characters: Character[];
}

export interface StoryData {
  storyTitle: string;
  universe: UniverseLore;
  characters: Character[];
  chapters: Chapter[];
  currentChapterIndex: number;
  config: AppConfig;
  readerSettings: ReaderSettings;
  savedWorlds?: WorldPreset[];
}
