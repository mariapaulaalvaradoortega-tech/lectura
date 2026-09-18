import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookMarked, 
  Hash, 
  Layers,
  RotateCcw,
  Sparkles,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Sliders,
  History,
  Undo2,
  Check,
  Palette,
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
  User
} from 'lucide-react';
import { VoiceDictationButton } from './VoiceDictationButton';
import { Chapter, Character, ReaderSettings, getEffectiveReaderTheme } from '../types';

export type RewriteMode = 'más larga' | 'más corta' | 'otro';

export type StyleOption = 
  | 'Agregarle más drama'
  | 'Menos drama'
  | 'Más realista'
  | 'Más datos médicos'
  | 'Más misterio'
  | 'Menos misterio'
  | 'Otros';

const STYLE_BUTTONS: { id: StyleOption; label: string; icon: string; description: string }[] = [
  { id: 'Agregarle más drama', label: 'Agregarle más drama', icon: '🎭', description: 'Intensifica la carga emocional y conflictos' },
  { id: 'Menos drama', label: 'Menos drama', icon: '😌', description: 'Tono más sobrio, contenido y sereno' },
  { id: 'Más realista', label: 'Más realista', icon: '🔍', description: 'Verosimilitud, lógica humana y física' },
  { id: 'Más datos médicos', label: 'Más datos médicos', icon: '🩺', description: 'Terminología clínica, anatomía y patología' },
  { id: 'Más misterio', label: 'Más misterio', icon: '🕵️', description: 'Suspenso, ambigüedad y pistas veladas' },
  { id: 'Menos misterio', label: 'Menos misterio', icon: '💡', description: 'Mayor claridad en motivos y revelaciones' },
  { id: 'Otros', label: 'Otros', icon: '✨', description: 'Personaliza con el nuevo campo de estilo' }
];

interface ReaderViewProps {
  chapter: Chapter;
  chapters: Chapter[];
  currentIndex: number;
  readerSettings: ReaderSettings;
  characters?: Character[];
  onSelectChapter: (index: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onRewriteChapter?: (options: {
    mode: RewriteMode;
    additionalNote: string;
    selectedStyles: StyleOption[];
    styleNote: string;
  }) => Promise<void> | void;
  onRevertChapter?: (versionId: string) => void;
  isRewriting?: boolean;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  chapter,
  chapters,
  currentIndex,
  readerSettings,
  characters = [],
  onSelectChapter,
  onPrevChapter,
  onNextChapter,
  onRewriteChapter,
  onRevertChapter,
  isRewriting = false
}) => {
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>('más larga');
  const [additionalNote, setAdditionalNote] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<StyleOption[]>([]);
  const [styleNote, setStyleNote] = useState('');
  const [activeTab, setActiveTab] = useState<'rewrite' | 'history'>('rewrite');

  // Search state inside chapter
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Word count & reading time calculation
  const words = chapter.content ? chapter.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 190));

  // Paragraph splitting
  const paragraphs = chapter.content 
    ? chapter.content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    : [];

  const historyList = chapter.history || [];

  // Count total matches in title and paragraphs
  const totalMatches = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || !chapter.content) return 0;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const fullText = (chapter.title || '') + ' ' + (chapter.content || '');
    const matches = fullText.match(regex);
    return matches ? matches.length : 0;
  }, [searchQuery, chapter.title, chapter.content]);

  // Adjust active match index when total matches changes
  useEffect(() => {
    if (totalMatches > 0) {
      if (activeMatchIndex === 0 || activeMatchIndex > totalMatches) {
        setActiveMatchIndex(1);
      }
    } else {
      setActiveMatchIndex(0);
    }
  }, [totalMatches, searchQuery]);

  // Auto scroll to active match
  useEffect(() => {
    if (activeMatchIndex > 0) {
      const el = document.getElementById(`search-match-${activeMatchIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeMatchIndex, searchQuery]);

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    setActiveMatchIndex((prev) => (prev >= totalMatches ? 1 : prev + 1));
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    setActiveMatchIndex((prev) => (prev <= 1 ? totalMatches : prev - 1));
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveMatchIndex(0);
  };

  const toggleStyle = (style: StyleOption) => {
    setSelectedStyles((prev) => {
      let next = [...prev];
      // Mutually exclusive pairs
      if (style === 'Agregarle más drama') {
        next = next.filter((s) => s !== 'Menos drama');
      } else if (style === 'Menos drama') {
        next = next.filter((s) => s !== 'Agregarle más drama');
      } else if (style === 'Más misterio') {
        next = next.filter((s) => s !== 'Menos misterio');
      } else if (style === 'Menos misterio') {
        next = next.filter((s) => s !== 'Más misterio');
      }

      if (next.includes(style)) {
        return next.filter((s) => s !== style);
      } else {
        return [...next, style];
      }
    });
  };

  const handleTriggerRewrite = async () => {
    if (!onRewriteChapter || isRewriting) return;
    await onRewriteChapter({
      mode: rewriteMode,
      additionalNote: additionalNote.trim(),
      selectedStyles,
      styleNote: styleNote.trim()
    });
    setIsRewriteOpen(false);
  };

  const handleRevert = (versionId: string) => {
    if (onRevertChapter) {
      onRevertChapter(versionId);
    }
  };

  // Determine font family style
  const getFontFamilyClass = () => {
    switch (readerSettings.fontFamily) {
      case 'sans':
        return 'font-sans tracking-normal';
      case 'mono':
        return 'font-mono text-[0.95em]';
      case 'serif':
      default:
        return 'font-serif tracking-wide';
    }
  };

  const getLineHeightClass = () => {
    switch (readerSettings.lineHeight) {
      case 'normal':
        return 'leading-relaxed';
      case 'loose':
        return 'leading-[2.2]';
      case 'relaxed':
      default:
        return 'leading-[1.85]';
    }
  };

  const getMaxWidthClass = () => {
    switch (readerSettings.maxWidth) {
      case 'narrow':
        return 'max-w-xl';
      case 'wide':
        return 'max-w-3xl';
      case 'normal':
      default:
        return 'max-w-2xl';
    }
  };

  const isPaper = getEffectiveReaderTheme(readerSettings) === 'paper';

  // Helper to render text with highlighted search query
  const renderHighlightedProse = (
    text: string,
    counterRef: { current: number }
  ) => {
    const q = searchQuery.trim();
    if (!q || !text) return text;

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === q.toLowerCase()) {
        counterRef.current += 1;
        const matchNumber = counterRef.current;
        const isActive = matchNumber === activeMatchIndex;

        return (
          <mark
            key={i}
            id={`search-match-${matchNumber}`}
            className={`transition-all duration-200 rounded px-1 py-0.2 mx-0.5 ${
              isActive
                ? isPaper
                  ? 'bg-amber-400 text-zinc-950 font-bold ring-2 ring-indigo-600 shadow-md'
                  : 'bg-amber-400 text-zinc-950 font-bold ring-2 ring-indigo-400 shadow-lg'
                : isPaper
                  ? 'bg-amber-200/95 text-amber-950 font-semibold ring-1 ring-amber-300'
                  : 'bg-amber-500/35 text-amber-200 font-semibold ring-1 ring-amber-400/40'
            }`}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const matchCounter = { current: 0 };

  return (
    <div className={`mx-auto w-full ${getMaxWidthClass()} px-4 py-6 sm:py-10 transition-all`}>
      {/* Search Bar in Reader */}
      <div className="mb-6">
        {!isSearchOpen && !searchQuery ? (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleOpenSearch}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all shadow-sm ${
                isPaper
                  ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 shadow-xs'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title="Buscar palabras clave o personajes en este capítulo"
            >
              <Search className="h-3.5 w-3.5 text-indigo-400" />
              <span>Buscar en capítulo</span>
            </button>
          </div>
        ) : (
          <div className={`rounded-2xl border p-3 sm:p-4 backdrop-blur-md shadow-lg transition-all ${
            isPaper
              ? 'border-zinc-200 bg-white/95 text-zinc-900 shadow-md'
              : 'border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-xl'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.shiftKey) {
                        handlePrevMatch();
                      } else {
                        handleNextMatch();
                      }
                    } else if (e.key === 'Escape') {
                      if (searchQuery) {
                        handleClearSearch();
                      } else {
                        setIsSearchOpen(false);
                      }
                    }
                  }}
                  placeholder="Buscar palabras clave o nombres de personajes..."
                  className={`w-full rounded-xl border py-2 pl-9 pr-16 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                    isPaper
                      ? 'border-zinc-300 bg-zinc-50 text-zinc-950 placeholder-zinc-400 focus:bg-white focus:border-indigo-500'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:bg-zinc-950 focus:border-indigo-500'
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <VoiceDictationButton
                    value={searchQuery}
                    onChange={setSearchQuery}
                    title="Buscar por voz"
                    isPaper={isPaper}
                    size="xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-zinc-400 hover:text-zinc-200 p-0.5"
                      title="Limpiar búsqueda"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Match counter & Navigation */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                {searchQuery.trim() && (
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-mono ${
                    totalMatches > 0
                      ? isPaper
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                      : isPaper
                        ? 'bg-zinc-100 text-zinc-500'
                        : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {totalMatches > 0 ? `${activeMatchIndex} de ${totalMatches}` : '0 resultados'}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    disabled={totalMatches === 0}
                    className={`rounded-lg border p-1.5 transition-all disabled:opacity-40 ${
                      isPaper
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                    title="Coincidencia anterior (Shift+Enter)"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMatch}
                    disabled={totalMatches === 0}
                    className={`rounded-lg border p-1.5 transition-all disabled:opacity-40 ${
                      isPaper
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                    title="Siguiente coincidencia (Enter)"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleClearSearch();
                      setIsSearchOpen(false);
                    }}
                    className={`rounded-lg border p-1.5 text-xs transition-all ${
                      isPaper
                        ? 'border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                        : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    title="Cerrar barra de búsqueda (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Character Filter Chips */}
            {characters && characters.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-dashed flex items-center gap-1.5 flex-wrap text-xs">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Buscar personaje:
                </span>
                {characters.map((char) => {
                  const isSelected = searchQuery.toLowerCase() === char.name.toLowerCase();
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(char.name);
                        setActiveMatchIndex(1);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        isSelected
                          ? isPaper
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-600 text-white shadow-xs'
                          : isPaper
                            ? 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-300'
                      }`}
                      title={`Buscar menciones de ${char.name} (${char.role})`}
                    >
                      <User className="h-3 w-3 opacity-70" />
                      <span>{char.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chapter Meta & Title */}
      <div className={`mb-10 text-center border-b pb-8 ${isPaper ? 'border-zinc-200' : 'border-zinc-800/60'}`}>
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-3 ${
          isPaper ? 'text-indigo-600' : 'text-indigo-400'
        }`}>
          <BookMarked className="h-3.5 w-3.5" />
          <span>Capítulo {chapter.number}</span>
        </div>

        <h1 
          className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${
            isPaper ? 'text-zinc-950' : 'text-zinc-100'
          } ${getFontFamilyClass()} mb-4`}
        >
          {renderHighlightedProse(chapter.title.replace(/^Capítulo\s*\d+:?\s*/i, '') || chapter.title, matchCounter)}
        </h1>

        <div className={`flex items-center justify-center gap-4 text-xs ${isPaper ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <span className="flex items-center gap-1">
            <Clock className={`h-3.5 w-3.5 ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`} />
            {readingTime} min de lectura
          </span>
          <span className={isPaper ? 'text-zinc-300' : 'text-zinc-600'}>•</span>
          <span className="flex items-center gap-1">
            <Hash className={`h-3.5 w-3.5 ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`} />
            {words} palabras
          </span>
          <span className={isPaper ? 'text-zinc-300' : 'text-zinc-600'}>•</span>
          <span className={`flex items-center gap-1 ${isPaper ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <Layers className={`h-3.5 w-3.5 ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`} />
            {currentIndex + 1} de {chapters.length}
          </span>
        </div>
      </div>

      {/* Chapter Prose */}
      <article 
        className={`reader-article ${getFontFamilyClass()} ${getLineHeightClass()} ${
          isPaper 
            ? 'text-zinc-900 selection:bg-indigo-100 selection:text-indigo-900 font-normal' 
            : 'text-zinc-200 selection:bg-indigo-900/60 selection:text-indigo-200'
        }`}
        style={{ fontSize: `${readerSettings.fontSize}px` }}
      >
        {paragraphs.map((para, idx) => (
          <p 
            key={idx} 
            className={`mb-6 text-justify ${
              idx === 0 
                ? isPaper
                  ? 'first-letter:float-left first-letter:mr-2.5 first-letter:text-5xl first-letter:font-bold first-letter:leading-none first-letter:text-indigo-600'
                  : 'first-letter:float-left first-letter:mr-2.5 first-letter:text-5xl first-letter:font-bold first-letter:leading-none first-letter:text-indigo-400' 
                : ''
            }`}
          >
            {renderHighlightedProse(para, matchCounter)}
          </p>
        ))}
      </article>

      {/* Disguised Emoji Button & Rewrite Action Panel */}
      <div className="relative mt-2 mb-6 flex flex-col items-end">
        {!isRewriteOpen ? (
          <div className="flex items-center gap-2">
            {/* Quick Revert badge if chapter has prior versions */}
            {historyList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  handleRevert(historyList[0].id);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all shadow-sm ${
                  isPaper
                    ? 'border-amber-400/50 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200'
                }`}
                title={`Revertir a la versión previa (${new Date(historyList[0].savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
              >
                <Undo2 className="h-3 w-3" />
                <span>Revertir ({historyList.length}/3)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsRewriteOpen(true)}
              className={`group flex h-9 w-9 items-center justify-center rounded-full border text-base sm:text-lg hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer ${
                isPaper
                  ? 'bg-white border-zinc-300 hover:border-indigo-500 hover:bg-zinc-50 text-zinc-800'
                  : 'bg-zinc-900/80 border-zinc-800/80 hover:border-indigo-500/50 hover:bg-zinc-800/90'
              }`}
              title="Reescribir capítulo o alterar estilo con IA"
              aria-label="Reescribir capítulo o alterar estilo con IA"
            >
              <span className="group-hover:rotate-12 transition-transform duration-300 select-none">
                ✍️
              </span>
            </button>
          </div>
        ) : (
          <div className={`w-full rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isPaper
              ? 'border-indigo-200 bg-white text-zinc-900'
              : 'border-indigo-500/30 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 text-zinc-100'
          }`}>
            {/* Header with Navigation Tabs */}
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isPaper ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  isPaper
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  <RotateCcw className={`h-4 w-4 ${isRewriting ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isPaper ? 'text-zinc-900' : 'text-zinc-100'}`}>
                    Reescribir y alterar estilo • Cap. {chapter.number}
                  </h3>
                  <p className={`text-[11px] ${isPaper ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Ajusta extensión, aplica variaciones de estilo o revierte a versiones previas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Tabs switch: Reescribir vs Historial */}
                <div className={`flex items-center rounded-lg border p-0.5 text-xs ${
                  isPaper ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rewrite')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeTab === 'rewrite'
                        ? 'bg-indigo-600 text-white shadow'
                        : isPaper ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Reescribir
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeTab === 'history'
                        ? 'bg-indigo-600 text-white shadow'
                        : isPaper ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <History className="h-3 w-3" />
                    <span>Historial ({historyList.length}/3)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRewriteOpen(false)}
                  disabled={isRewriting}
                  className={`rounded-lg p-1 transition-colors ${
                    isPaper ? 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {activeTab === 'rewrite' ? (
              <div className="space-y-4">
                {/* 1. Modalidad de extensión */}
                <div className="space-y-1.5">
                  <label className={`text-[11px] font-semibold uppercase tracking-wider ${isPaper ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    1. Modalidad de extensión:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRewriteMode('más larga')}
                      disabled={isRewriting}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                        rewriteMode === 'más larga'
                          ? isPaper
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400 shadow-sm'
                            : 'border-indigo-500 bg-indigo-600/20 text-indigo-200 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                          : isPaper
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900'
                            : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Más larga</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRewriteMode('más corta')}
                      disabled={isRewriting}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                        rewriteMode === 'más corta'
                          ? isPaper
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400 shadow-sm'
                            : 'border-indigo-500 bg-indigo-600/20 text-indigo-200 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                          : isPaper
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900'
                            : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span>Más corta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRewriteMode('otro')}
                      disabled={isRewriting}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                        rewriteMode === 'otro'
                          ? isPaper
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400 shadow-sm'
                            : 'border-indigo-500 bg-indigo-600/20 text-indigo-200 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                          : isPaper
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900'
                            : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Otro</span>
                    </button>
                  </div>
                </div>

                {/* Rectángulo de texto original: Instrucción de trama / extensión */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isPaper ? 'text-zinc-700' : 'text-zinc-300'
                    }`}>
                      Instrucción de trama o extensión:
                    </label>
                    <div className="flex items-center gap-2">
                      <VoiceDictationButton
                        value={additionalNote}
                        onChange={setAdditionalNote}
                        title="Dictar instrucción por voz"
                        isPaper={isPaper}
                        size="xs"
                      />
                      {additionalNote && (
                        <button
                          type="button"
                          onClick={() => setAdditionalNote('')}
                          className={`text-[10px] ${isPaper ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    disabled={isRewriting}
                    placeholder="Ej: Agrega más tensión en el diálogo final, haz que descubran una pista oculta antes del desenlace..."
                    className={`w-full rounded-xl border p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all ${
                      isPaper
                        ? 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                        : 'border-zinc-800 bg-zinc-950/80 text-zinc-200 placeholder-zinc-500'
                    }`}
                  />
                </div>

                {/* 2. Alterar el estilo (Botones solicitados) */}
                <div className={`space-y-2 pt-2 border-t ${isPaper ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      isPaper ? 'text-zinc-700' : 'text-zinc-300'
                    }`}>
                      <Palette className={`h-3.5 w-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
                      <span>2. Alterar el estilo:</span>
                    </label>
                    {selectedStyles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStyles([])}
                        className={`text-[10px] ${isPaper ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Desmarcar todos ({selectedStyles.length})
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {STYLE_BUTTONS.map((item) => {
                      const isSelected = selectedStyles.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleStyle(item.id)}
                          disabled={isRewriting}
                          title={item.description}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                            isSelected
                              ? isPaper
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400 font-semibold shadow-sm'
                                : 'border-indigo-500 bg-indigo-600/30 text-indigo-200 ring-1 ring-indigo-500/50 font-semibold shadow-sm'
                              : isPaper
                                ? 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900'
                                : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                          {isSelected && <Check className={`h-3 w-3 ml-0.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NUEVO Rectángulo de texto para escribir más sobre el estilo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isPaper ? 'text-zinc-700' : 'text-zinc-300'
                    }`}>
                      Detalles adicionales de estilo y tono:
                    </label>
                    <div className="flex items-center gap-2">
                      <VoiceDictationButton
                        value={styleNote}
                        onChange={setStyleNote}
                        title="Dictar estilo por voz"
                        isPaper={isPaper}
                        size="xs"
                      />
                      {styleNote && (
                        <button
                          type="button"
                          onClick={() => setStyleNote('')}
                          className={`text-[10px] ${isPaper ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={styleNote}
                    onChange={(e) => setStyleNote(e.target.value)}
                    disabled={isRewriting}
                    placeholder="Ej: Voz narrativa más poética y oscura, términos quirúrgicos precisos, ritmo trepidante, atmósfera gótica..."
                    className={`w-full rounded-xl border p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all ${
                      isPaper
                        ? 'border-indigo-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                        : 'border-indigo-500/30 bg-zinc-950/90 text-zinc-100 placeholder-zinc-500'
                    }`}
                  />
                </div>

                {/* Actions */}
                <div className={`flex items-center justify-between gap-2 pt-2 border-t ${isPaper ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                  <div className="text-[11px]">
                    {historyList.length > 0 ? (
                      <span className={isPaper ? 'text-zinc-500' : 'text-zinc-500'}>
                        {historyList.length} versión(es) previa(s) disponible(s) para revertir
                      </span>
                    ) : (
                      <span className={isPaper ? 'text-zinc-500' : 'text-zinc-500'}>
                        Se guardará copia de la versión actual para poder revertir
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRewriteOpen(false)}
                      disabled={isRewriting}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                        isPaper
                          ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                          : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerRewrite}
                      disabled={isRewriting}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-indigo-600/20"
                    >
                      {isRewriting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Reescribiendo...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reescribir capítulo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB: Historial de las últimas 3 versiones */
              <div className="space-y-3">
                <div className={`flex items-center justify-between text-xs ${isPaper ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <span>Guarda automáticamente las últimas 3 versiones antes de cada reescritura.</span>
                  <span className={`font-semibold ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`}>{historyList.length} de 3 guardadas</span>
                </div>

                {historyList.length === 0 ? (
                  <div className={`rounded-xl border p-6 text-center space-y-2 ${
                    isPaper ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800/80 bg-zinc-950/60'
                  }`}>
                    <History className={`h-6 w-6 mx-auto ${isPaper ? 'text-zinc-400' : 'text-zinc-600'}`} />
                    <p className={`text-xs ${isPaper ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      No hay reescrituras previas en este capítulo aún.
                    </p>
                    <p className={`text-[11px] ${isPaper ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      Cuando reescribas el capítulo, la versión actual se guardará automáticamente aquí para que puedas revertir cambios en cualquier momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historyList.map((ver, idx) => (
                      <div
                        key={ver.id}
                        className={`rounded-xl border p-3.5 space-y-2 transition-colors ${
                          isPaper
                            ? 'border-zinc-200 bg-white hover:border-indigo-400 shadow-sm'
                            : 'border-zinc-800 bg-zinc-950/80 hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                              isPaper ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className={`text-xs font-semibold ${isPaper ? 'text-zinc-900' : 'text-zinc-200'}`}>
                              {ver.label || `Versión ${idx + 1}`}
                            </span>
                            <span className={`text-[10px] ${isPaper ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              {new Date(ver.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ver.wordCount} palabras
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleRevert(ver.id);
                              setIsRewriteOpen(false);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all shadow-sm ${
                              isPaper
                                ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                                : 'border-amber-500/40 bg-amber-950/50 text-amber-300 hover:bg-amber-800 hover:text-white'
                            }`}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Revertir a esta</span>
                          </button>
                        </div>

                        {ver.rewriteNote && (
                          <div className={`text-[10px] p-1.5 rounded-md border ${
                            isPaper
                              ? 'text-zinc-700 bg-zinc-50 border-zinc-200'
                              : 'text-zinc-400 bg-zinc-900/60 border-zinc-800/60'
                          }`}>
                            <span className={`font-medium ${isPaper ? 'text-indigo-700' : 'text-indigo-400'}`}>Directriz: </span>
                            <span className="italic">{ver.rewriteNote.slice(0, 140)}...</span>
                          </div>
                        )}

                        <p className={`text-[11px] line-clamp-2 italic font-serif p-2 rounded border ${
                          isPaper
                            ? 'text-zinc-700 bg-zinc-50 border-zinc-200'
                            : 'text-zinc-400 bg-zinc-900/40 border-zinc-800/40'
                        }`}>
                          "{ver.content.slice(0, 160)}..."
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Flourish Ornament */}
      <div className={`my-12 flex items-center justify-center gap-3 ${isPaper ? 'text-zinc-400' : 'text-zinc-600'}`}>
        <span className={`h-px w-16 ${isPaper ? 'bg-zinc-300' : 'bg-zinc-800'}`} />
        <span className={`text-sm tracking-widest ${isPaper ? 'text-indigo-600' : 'text-indigo-400/80'}`}>✦ ✦ ✦</span>
        <span className={`h-px w-16 ${isPaper ? 'bg-zinc-300' : 'bg-zinc-800'}`} />
      </div>

      {/* Chapter Navigation Bar */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border p-3 sm:p-4 backdrop-blur-sm ${
        isPaper
          ? 'border-zinc-200 bg-white/95 shadow-md text-zinc-900'
          : 'border-zinc-800 bg-zinc-900/70 text-zinc-200'
      }`}>
        <button
          onClick={onPrevChapter}
          disabled={currentIndex <= 0}
          className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none transition-all ${
            isPaper
              ? 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400'
              : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Cap. Anterior</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <select
            value={currentIndex}
            onChange={(e) => onSelectChapter(parseInt(e.target.value, 10))}
            aria-label="Seleccionar capítulo"
            className={`w-full sm:w-auto rounded-lg border px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none ${
              isPaper
                ? 'border-zinc-300 bg-zinc-50 text-zinc-900'
                : 'border-zinc-800 bg-zinc-950 text-zinc-200'
            }`}
          >
            {chapters.map((c, i) => (
              <option key={c.id || i} value={i}>
                Cap. {i + 1}: {c.title.replace(/^Capítulo\s*\d+:?\s*/i, '')}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onNextChapter}
          disabled={currentIndex >= chapters.length - 1}
          className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none transition-all ${
            isPaper
              ? 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400'
              : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800'
          }`}
        >
          <span>Cap. Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
