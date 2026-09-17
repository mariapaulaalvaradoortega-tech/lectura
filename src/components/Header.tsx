import React from 'react';
import { 
  BookOpen, 
  Settings, 
  Users, 
  Sliders, 
  Check, 
  ArrowLeft,
  Feather,
  Search
} from 'lucide-react';
import { StoryItem, WorldItem } from '../types';

interface HeaderProps {
  story: StoryItem;
  world: WorldItem;
  currentChapterIndex: number;
  totalChapters: number;
  onBackToWorld: () => void;
  onOpenCharacters: () => void;
  onOpenSettings: () => void;
  onOpenReaderSettings: () => void;
  onOpenExportIndex: () => void;
  onOpenSearch?: () => void;
  isSaving: boolean;
  isPaper?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  story,
  world,
  currentChapterIndex,
  totalChapters,
  onBackToWorld,
  onOpenCharacters,
  onOpenSettings,
  onOpenReaderSettings,
  onOpenExportIndex,
  onOpenSearch,
  isSaving,
  isPaper = false
}) => {
  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      isPaper ? 'border-zinc-200 bg-white/95 text-zinc-900 shadow-sm' : 'border-zinc-800/80 bg-zinc-950/85 text-zinc-100'
    }`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Back button + Story & World title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToWorld}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isPaper 
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
            title={`Volver a las historias de ${world.name}`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Historias</span>
          </button>

          <div className={`h-4 w-px hidden sm:block ${isPaper ? 'bg-zinc-200' : 'bg-zinc-800'}`} />

          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-xs ${
                isPaper ? 'text-zinc-950' : 'text-zinc-100'
              }`}>
                {story.title}
              </span>
              <span className={`hidden md:inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-medium ${
                isPaper
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
              }`}>
                {world.name}
              </span>
            </div>
            <div className={`flex items-center gap-2 text-[11px] ${isPaper ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span>Capítulo {currentChapterIndex + 1} de {totalChapters}</span>
              <span className={isPaper ? 'text-zinc-300' : 'text-zinc-600'}>•</span>
              <span className={`inline-flex items-center gap-1 font-mono ${isPaper ? 'text-emerald-600' : 'text-emerald-400'}`}>
                {isSaving ? (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {isSaving ? 'Guardando...' : 'Guardado'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global Search across Worlds & Stories */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                isPaper
                  ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                  : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Buscar en mundos (contexto, capítulos, historias, fechas)"
            >
              <Search className={`h-3.5 w-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span className="hidden lg:inline">Buscar mundos</span>
            </button>
          )}

          {/* Character Sheets & Relationships */}
          <button
            onClick={onOpenCharacters}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isPaper
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Ver fichas de personajes y relaciones de este mundo"
          >
            <Users className={`h-3.5 w-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
            <span className="hidden sm:inline">Fichas & Relaciones</span>
          </button>

          {/* Export Index Button */}
          <button
            onClick={onOpenExportIndex}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isPaper
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Índice y exportación de historias y capítulos"
          >
            <BookOpen className={`h-3.5 w-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
            <span className="hidden md:inline">Índice & Exportar</span>
          </button>

          {/* Reader Typography (Aa) */}
          <button
            onClick={onOpenReaderSettings}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isPaper
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Ajustes de lectura (Tipografía, tamaño y tema)"
          >
            <Sliders className={`h-3.5 w-3.5 ${isPaper ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <span className="font-serif font-bold text-xs">Aa</span>
          </button>

          {/* Key & Settings */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 rounded-lg border p-2 transition-all ${
              isPaper
                ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Configurar Gemini API Key"
          >
            <Settings className={`h-4 w-4 ${isPaper ? 'text-zinc-500' : 'text-zinc-400'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
