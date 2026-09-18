import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Lightbulb, 
  Key,
  AlertCircle,
  Feather,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  PenTool
} from 'lucide-react';
import { VoiceDictationButton } from './VoiceDictationButton';
import { Chapter, Character, WorldItem, StoryItem } from '../types';

interface CommentBoxProps {
  currentChapterNumber: number;
  currentChapter?: Chapter;
  characters?: Character[];
  world?: WorldItem | null;
  story?: StoryItem | null;
  apiKey?: string;
  hasServerKey?: boolean;
  selectedModel?: string;
  hasApiKey: boolean;
  isGenerating: boolean;
  onGenerateNextChapter: (userNote: string, chapterTitle?: string) => Promise<void>;
  onOpenSettings: () => void;
  isPaper?: boolean;
}

export const CommentBox: React.FC<CommentBoxProps> = ({
  currentChapterNumber,
  currentChapter,
  characters = [],
  world,
  story,
  apiKey,
  hasServerKey,
  selectedModel,
  hasApiKey,
  isGenerating,
  onGenerateNextChapter,
  onOpenSettings,
  isPaper = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Extract real valid character names from the active story/world
  const validCharNames = useMemo(() => {
    return characters
      .map((c) => c.name.trim())
      .filter((n) => n.length > 0);
  }, [characters]);

  // Generate procedural fallback suggestions strictly based on REAL active characters and chapter
  const getProceduralSuggestions = useCallback(() => {
    const names = validCharNames;

    if (names.length >= 2) {
      return [
        `${names[0]} confronta a ${names[1]} sobre lo ocurrido y deben tomar una decisión inmediata.`,
        `Una revelación inesperada altera el curso de la misión entre ${names[0]} y ${names[1]}.`,
        `${names[0]} decide investigar por su cuenta antes de que ${names[1]} descubra la verdad.`
      ];
    } else if (names.length === 1) {
      return [
        `${names[0]} enfrenta las consecuencias inmediatas de los hechos del capítulo anterior.`,
        `${names[0]} descubre un secreto oculto que pone en riesgo sus objetivos principales.`,
        `Un encuentro imprevisto obliga a ${names[0]} a cambiar de rumbo drásticamente.`
      ];
    } else {
      return [
        'El conflicto central se intensifica revelando nuevos misterios y consecuencias.',
        'Un giro imprevisto altera la situación tras el desenlace del capítulo reciente.',
        'Se profundiza en las secuelas emocionales y el peligro que acecha.'
      ];
    }
  }, [validCharNames]);

  const [suggestions, setSuggestions] = useState<string[]>(() => {
    if (currentChapter?.suggestions && currentChapter.suggestions.length > 0) {
      return currentChapter.suggestions;
    }
    return getProceduralSuggestions();
  });

  // Function to fetch contextual suggestions using Gemini on demand
  const fetchSmartSuggestions = useCallback(async () => {
    if (!hasApiKey && !hasServerKey) {
      setSuggestions(getProceduralSuggestions());
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      // Take up to 3500 characters of the current chapter for rich narrative concordance
      const snippet = currentChapter?.content
        ? currentChapter.content.slice(-3500)
        : '';

      const response = await fetch('/api/gemini/suggest-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          storyTitle: story?.title || 'Historia',
          chapterNumber: currentChapter?.number || currentChapterNumber,
          chapterTitle: currentChapter?.title || `Capítulo ${currentChapterNumber}`,
          chapterSnippet: snippet,
          characters: characters.map((c) => ({
            name: c.name,
            role: c.role,
            description: c.description || c.history
          })),
          worldName: world?.name || '',
          worldRules: world?.worldRules || '',
          model: selectedModel || 'gemini-3.1-flash-lite'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          return;
        }
      }
      // If endpoint response fails, use procedural grounded suggestions
      setSuggestions(getProceduralSuggestions());
    } catch (e) {
      console.warn('Could not fetch AI suggestions, using procedural contextual suggestions:', e);
      setSuggestions(getProceduralSuggestions());
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [
    hasApiKey,
    hasServerKey,
    apiKey,
    story?.title,
    currentChapter?.number,
    currentChapter?.title,
    currentChapter?.content,
    currentChapterNumber,
    characters,
    world?.name,
    world?.worldRules,
    selectedModel,
    getProceduralSuggestions
  ]);

  // Load suggestions directly from chapter response or fetch if not present
  useEffect(() => {
    if (currentChapter?.suggestions && currentChapter.suggestions.length > 0) {
      setSuggestions(currentChapter.suggestions);
    } else {
      fetchSmartSuggestions();
    }
  }, [currentChapter?.id, currentChapter?.number, currentChapter?.suggestions, fetchSmartSuggestions]);

  // If user triggers generation, automatically expand panel to show progress
  useEffect(() => {
    if (isGenerating) {
      setIsExpanded(true);
    }
  }, [isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await onGenerateNextChapter(note.trim(), chapterTitle.trim());
      setNote('');
      setChapterTitle('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al procesar la redacción del capítulo.');
    }
  };

  // Dynamic contextual placeholder using active characters
  const placeholderText = useMemo(() => {
    if (validCharNames.length >= 2) {
      return `Escribe tu indicación para la siguiente escena (ej: ${validCharNames[0]} y ${validCharNames[1]} descubren la verdad tras lo ocurrido...)`;
    } else if (validCharNames.length === 1) {
      return `Escribe tu indicación para la siguiente escena (ej: ${validCharNames[0]} toma una decisión arriesgada tras el desenlace...)`;
    }
    return 'Escribe tu indicación para la siguiente escena del capítulo...';
  }, [validCharNames]);

  return (
    <section className="mx-auto mt-6 w-full max-w-2xl px-4 pb-14 transition-all duration-300">
      {/* 1. DISCREET COLLAPSED TRIGGER VIEW */}
      {!isExpanded && !isGenerating && (
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            id="btn-expand-continuation"
            onClick={() => setIsExpanded(true)}
            className={`group flex items-center gap-3 rounded-full border px-5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
              isPaper
                ? 'border-zinc-300 bg-white/95 text-zinc-800 hover:border-indigo-500 hover:text-indigo-900 hover:bg-zinc-50'
                : 'border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-indigo-500/60 hover:text-white hover:bg-zinc-800/90'
            }`}
          >
            {/* Emoji Trigger Icon with Subtle Pulse on Hover */}
            <span 
              className="text-base sm:text-lg transition-transform duration-200 group-hover:scale-125 select-none"
              role="img"
              aria-label="Continuar lectura"
            >
              ✍️
            </span>

            <span className="font-semibold tracking-wide">
              Continuar lectura & notas
            </span>

            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
              isPaper ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-950/80 border border-indigo-700/40 text-indigo-300'
            }`}>
              Cap. {currentChapterNumber + 1}
            </span>

            <ChevronDown className={`h-4 w-4 transition-transform group-hover:translate-y-0.5 ${
              isPaper ? 'text-zinc-500' : 'text-zinc-400'
            }`} />
          </button>
        </div>
      )}

      {/* 2. EXPANDED FULL CONTINUATION & NOTES PANEL */}
      {(isExpanded || isGenerating) && (
        <div 
          id="panel-continuation-expanded"
          className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-md shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 ${
            isPaper
              ? 'border-zinc-200 bg-white text-zinc-900 shadow-xl'
              : 'border-zinc-800/90 bg-zinc-900/90 text-zinc-100'
          }`}
        >
          {/* Decorative Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

          {/* Section Header with Emoji Trigger & Collapse Button */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => !isGenerating && setIsExpanded(false)}
                title="Minimizar panel de notas"
                disabled={isGenerating}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:hover:scale-100 ${
                  isPaper 
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                    : 'bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/20'
                }`}
              >
                <span className="text-base select-none" role="img" aria-label="Escritura">✍️</span>
              </button>

              <div>
                <h2 className={`text-sm sm:text-base font-semibold leading-tight ${isPaper ? 'text-zinc-950' : 'text-zinc-100'}`}>
                  Continuar Lectura & Notas del Capítulo
                </h2>
                <span className={`text-[11px] font-mono ${isPaper ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Siguiente entrega: Capítulo {currentChapterNumber + 1}
                </span>
              </div>
            </div>

            {/* Minimize / Collapse Button */}
            {!isGenerating && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                title="Plegar / Hacer discreto"
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  isPaper
                    ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Minimizar</span>
              </button>
            )}
          </div>

          <p className={`text-xs leading-relaxed mb-4 ${isPaper ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Escribe tus directrices o comentarios para el siguiente episodio. El relato continuará respetando las leyes del mundo y el curso de los personajes.
          </p>

          {/* Quick idea chips grounded directly in the chapter's response */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold ${
                isPaper ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                <Lightbulb className={`h-3.5 w-3.5 ${isPaper ? 'text-amber-500' : 'text-amber-400'}`} />
                Sugerencias para continuar:
              </span>

              <button
                type="button"
                onClick={fetchSmartSuggestions}
                disabled={isFetchingSuggestions || isGenerating}
                className={`inline-flex items-center gap-1 text-[11px] transition-colors disabled:opacity-50 ${
                  isPaper ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'
                }`}
                title="Generar nuevas sugerencias alternativas basadas en el texto"
              >
                <RefreshCw className={`h-3 w-3 ${isFetchingSuggestions ? 'animate-spin' : ''}`} />
                <span>{isFetchingSuggestions ? 'Generando...' : 'Nuevas ideas'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {suggestions.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNote(idea)}
                  disabled={isGenerating || isFetchingSuggestions}
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-all disabled:opacity-50 text-left leading-relaxed ${
                    isPaper
                      ? 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-950'
                      : 'border-zinc-800/80 bg-zinc-950/70 text-zinc-300 hover:border-indigo-500/50 hover:bg-zinc-800/90 hover:text-white'
                  }`}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Form Formatted as Continuation & Comment Field */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Optional Chapter Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className={`text-[11px] font-medium ${isPaper ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    Título del capítulo (opcional)
                  </label>
                  <VoiceDictationButton
                    value={chapterTitle}
                    onChange={setChapterTitle}
                    title="Dictar título por voz"
                    isPaper={isPaper}
                    size="xs"
                  />
                </div>
                <span className={`text-[10px] ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Si se omite, se generará a partir del contenido
                </span>
              </div>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                disabled={isGenerating}
                placeholder="Opcional: Si se deja en blanco, se creará un título a partir del contenido"
                className={`w-full rounded-xl border p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all disabled:opacity-50 ${
                  isPaper
                    ? 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                    : 'border-zinc-800 bg-zinc-950/80 text-zinc-200 placeholder-zinc-500 focus:bg-zinc-950'
                }`}
              />
            </div>

            {/* User Instruction / Reader Note */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-medium ${isPaper ? 'text-zinc-700' : 'text-zinc-400'}`}>
                  Instrucción o pauta para la redacción
                </label>
                <VoiceDictationButton
                  value={note}
                  onChange={setNote}
                  title="Dictar directrices por voz"
                  isPaper={isPaper}
                  size="sm"
                />
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isGenerating}
                rows={3}
                placeholder={placeholderText}
                className={`w-full rounded-xl border p-3 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all resize-y disabled:opacity-50 ${
                  isPaper
                    ? 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                    : 'border-zinc-800 bg-zinc-950/80 text-zinc-200 placeholder-zinc-500 focus:bg-zinc-950'
                }`}
              />
            </div>

            {/* Key Alert Warning if not set */}
            {!hasApiKey && (
              <div className={`flex items-center justify-between rounded-lg border p-2.5 text-xs ${
                isPaper
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Configura tu Gemini API Key para iniciar la redacción.</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="shrink-0 font-medium underline hover:opacity-80 ml-2"
                >
                  Configurar
                </button>
              </div>
            )}

            {errorMsg && (
              <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                isPaper
                  ? 'border-rose-300 bg-rose-50 text-rose-900'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}>
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="block mt-1 font-medium underline hover:opacity-80"
                  >
                    Revisar configuración de API Key
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                disabled={isGenerating}
                className={`text-xs underline-offset-4 hover:underline transition-colors ${
                  isPaper ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cerrar notas
              </button>

              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:border-indigo-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Redactando Capítulo {currentChapterNumber + 1}...</span>
                  </>
                ) : (
                  <>
                    <Feather className="h-3.5 w-3.5" />
                    <span>Redactar Capítulo {currentChapterNumber + 1}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clean, Literary Loading State without authorial meta-dialogue */}
          {isGenerating && (
            <div className={`mt-4 rounded-xl border p-4 text-center ${
              isPaper
                ? 'border-zinc-200 bg-zinc-50 text-zinc-900'
                : 'border-zinc-800 bg-zinc-950/80 text-zinc-300'
            }`}>
              <div className="flex items-center justify-center gap-2 text-xs font-medium mb-1">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Compaginando Capítulo {currentChapterNumber + 1}...</span>
              </div>
              <p className={`text-[11px] ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Procesando el contexto de la historia y redactando la continuación literaria con sus sugerencias.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
