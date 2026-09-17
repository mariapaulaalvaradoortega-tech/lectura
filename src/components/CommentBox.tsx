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
  RefreshCw
} from 'lucide-react';
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

  const [suggestions, setSuggestions] = useState<string[]>(() => getProceduralSuggestions());

  // Function to fetch contextual suggestions using Gemini
  const fetchSmartSuggestions = useCallback(async () => {
    if (!hasApiKey && !hasServerKey) {
      setSuggestions(getProceduralSuggestions());
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      // Take the last 1200 characters of the current chapter for immediate narrative context
      const snippet = currentChapter?.content
        ? currentChapter.content.slice(-1200)
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

  // Refresh suggestions when current chapter changes
  useEffect(() => {
    fetchSmartSuggestions();
  }, [currentChapter?.id, currentChapter?.number]);

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
    <section className="mx-auto mt-8 w-full max-w-2xl px-4 pb-16">
      <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-md shadow-2xl transition-all ${
        isPaper
          ? 'border-zinc-200 bg-white text-zinc-900 shadow-xl'
          : 'border-zinc-800/90 bg-zinc-900/60 text-zinc-100'
      }`}>
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

        {/* Section Header (Clean literary continuation) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isPaper ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              <MessageSquare className="h-4 w-4" />
            </div>
            <h2 className={`text-sm sm:text-base font-semibold ${isPaper ? 'text-zinc-950' : 'text-zinc-100'}`}>
              Continuar Lectura & Notas del Capítulo
            </h2>
          </div>
          <span className={`text-[11px] font-mono ${isPaper ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Siguiente: Capítulo {currentChapterNumber + 1}
          </span>
        </div>

        <p className={`text-xs leading-relaxed mb-4 ${isPaper ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Escribe tus directrices o comentarios para el siguiente episodio. El relato continuará respetando las leyes del mundo y el curso de los personajes.
        </p>

        {/* Quick idea chips grounded in actual story text and characters */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold ${
              isPaper ? 'text-zinc-600' : 'text-zinc-400'
            }`}>
              <Lightbulb className={`h-3 w-3 ${isPaper ? 'text-amber-500' : 'text-amber-400'}`} />
              Sugerencias para el texto:
            </span>

            <button
              type="button"
              onClick={fetchSmartSuggestions}
              disabled={isFetchingSuggestions || isGenerating}
              className={`inline-flex items-center gap-1 text-[11px] transition-colors disabled:opacity-50 ${
                isPaper ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'
              }`}
              title="Generar nuevas sugerencias basadas en el texto"
            >
              <RefreshCw className={`h-3 w-3 ${isFetchingSuggestions ? 'animate-spin' : ''}`} />
              <span>{isFetchingSuggestions ? 'Analizando texto...' : 'Nuevas ideas'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {suggestions.map((idea, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNote(idea)}
                disabled={isGenerating || isFetchingSuggestions}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50 text-left ${
                  isPaper
                    ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-indigo-400 hover:bg-zinc-200 hover:text-zinc-950'
                    : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-indigo-500/50 hover:bg-zinc-800 hover:text-white'
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
              <label className={`text-[11px] font-medium ${isPaper ? 'text-zinc-700' : 'text-zinc-400'}`}>
                Título del capítulo (opcional)
              </label>
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
            <label className={`text-[11px] font-medium ${isPaper ? 'text-zinc-700' : 'text-zinc-400'}`}>
              Instrucción o pauta para la redacción
            </label>
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

          <div className="flex items-center justify-end pt-1">
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
              Procesando el contexto de la historia y redactando la continuación literaria.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
