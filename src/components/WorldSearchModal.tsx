import React, { useState, useMemo } from 'react';
import { WorldItem, StoryItem } from '../types';
import { 
  Search, 
  X, 
  Globe, 
  BookOpen, 
  FileText, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Scroll, 
  ShieldAlert, 
  Users, 
  Clock, 
  Filter,
  Check
} from 'lucide-react';

interface WorldSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  worlds: WorldItem[];
  stories: StoryItem[];
  onNavigateToWorld: (world: WorldItem) => void;
  onNavigateToStory: (worldId: string, story: StoryItem) => void;
  onNavigateToChapter: (worldId: string, storyId: string, chapterIndex: number) => void;
}

export type SearchCategoryFilter = 'all' | 'worlds' | 'stories' | 'chapters' | 'dates';

interface SearchResultItem {
  id: string;
  type: 'world' | 'story' | 'chapter';
  title: string;
  subtitle: string;
  matchedField: string;
  excerpt: string;
  dateStr: string;
  world: WorldItem;
  story?: StoryItem;
  chapterIndex?: number;
  score: number;
}

export const WorldSearchModal: React.FC<WorldSearchModalProps> = ({
  isOpen,
  onClose,
  worlds,
  stories,
  onNavigateToWorld,
  onNavigateToStory,
  onNavigateToChapter
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SearchCategoryFilter>('all');

  // Helper to extract a text excerpt around the matched query
  const getExcerpt = (fullText: string, searchTerm: string, maxLen = 140): string => {
    if (!fullText) return '';
    const idx = fullText.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) {
      return fullText.length > maxLen ? fullText.slice(0, maxLen) + '...' : fullText;
    }
    const start = Math.max(0, idx - 45);
    const end = Math.min(fullText.length, idx + searchTerm.length + 65);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < fullText.length ? '...' : '';
    return prefix + fullText.slice(start, end).replace(/\n+/g, ' ') + suffix;
  };

  // Helper to highlight query inside text
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Search in Worlds (Context, Rules, Forbidden, Lore, Characters, Dates)
    worlds.forEach((world) => {
      const worldDate = world.createdAt ? new Date(world.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : '';

      const isDateMatch = worldDate.toLowerCase().includes(q) || (world.createdAt && world.createdAt.toLowerCase().includes(q));
      const isNameMatch = world.name.toLowerCase().includes(q);
      const isDescMatch = (world.description || '').toLowerCase().includes(q);
      const isGenreMatch = (world.genre || '').toLowerCase().includes(q);
      const isRulesMatch = (world.worldRules || '').toLowerCase().includes(q);
      const isForbiddenMatch = (world.forbiddenThings || '').toLowerCase().includes(q);

      // Check world characters
      const matchedChar = world.characters.find(c => 
        c.name.toLowerCase().includes(q) || 
        (c.history || '').toLowerCase().includes(q) ||
        (c.traits || '').toLowerCase().includes(q) ||
        (c.secretsOrGoals || '').toLowerCase().includes(q)
      );

      if (categoryFilter === 'all' || categoryFilter === 'worlds' || (categoryFilter === 'dates' && isDateMatch)) {
        if (isNameMatch || isDescMatch || isGenreMatch || isRulesMatch || isForbiddenMatch || matchedChar || isDateMatch) {
          let field = 'Nombre del Mundo';
          let excerpt = world.description || '';
          let score = 10;

          if (isNameMatch) {
            field = 'Nombre del Mundo';
            score = 100;
          } else if (isRulesMatch) {
            field = 'Reglas del Mundo';
            excerpt = getExcerpt(world.worldRules, q);
            score = 60;
          } else if (isForbiddenMatch) {
            field = 'Leyes Prohibidas';
            excerpt = getExcerpt(world.forbiddenThings, q);
            score = 60;
          } else if (matchedChar) {
            field = `Personaje: ${matchedChar.name}`;
            excerpt = getExcerpt(`${matchedChar.name} (${matchedChar.role}): ${matchedChar.history || matchedChar.traits || ''}`, q);
            score = 50;
          } else if (isDescMatch) {
            field = 'Contexto / Lore';
            excerpt = getExcerpt(world.description || '', q);
            score = 40;
          } else if (isGenreMatch) {
            field = 'Género del Mundo';
            excerpt = world.genre || '';
            score = 30;
          } else if (isDateMatch) {
            field = 'Fecha de Creación';
            excerpt = `Mundo creado el ${worldDate}`;
            score = 25;
          }

          items.push({
            id: `world-${world.id}`,
            type: 'world',
            title: world.name,
            subtitle: world.genre || 'Mundo Literario',
            matchedField: field,
            excerpt,
            dateStr: worldDate,
            world,
            score
          });
        }
      }
    });

    // 2. Search in Stories and their Chapters
    stories.forEach((story) => {
      const world = worlds.find((w) => w.id === story.worldId) || worlds[0];
      const storyDate = story.createdAt ? new Date(story.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : '';

      const isStoryDateMatch = storyDate.toLowerCase().includes(q) || (story.createdAt && story.createdAt.toLowerCase().includes(q));
      const isStoryTitleMatch = story.title.toLowerCase().includes(q);
      const isStoryDescMatch = (story.description || '').toLowerCase().includes(q);

      // Check if story matches
      if (categoryFilter === 'all' || categoryFilter === 'stories' || (categoryFilter === 'dates' && isStoryDateMatch)) {
        if (isStoryTitleMatch || isStoryDescMatch || isStoryDateMatch) {
          let field = 'Título de la Historia';
          let excerpt = story.description;
          let score = 20;

          if (isStoryTitleMatch) {
            field = 'Título de Historia';
            score = 90;
          } else if (isStoryDescMatch) {
            field = 'Premisa de Historia';
            excerpt = getExcerpt(story.description, q);
            score = 40;
          } else if (isStoryDateMatch) {
            field = 'Fecha de Creación';
            excerpt = `Historia creada el ${storyDate}`;
            score = 25;
          }

          items.push({
            id: `story-${story.id}`,
            type: 'story',
            title: story.title,
            subtitle: `${world?.name || 'Mundo'} • ${story.chapters.length} cap(s)`,
            matchedField: field,
            excerpt,
            dateStr: storyDate,
            world: world || worlds[0],
            story,
            score
          });
        }
      }

      // 3. Search in individual Chapters
      if (categoryFilter === 'all' || categoryFilter === 'chapters' || categoryFilter === 'dates') {
        story.chapters.forEach((ch, chIdx) => {
          const chDate = ch.createdAt ? new Date(ch.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : storyDate;

          const isChDateMatch = chDate.toLowerCase().includes(q) || (ch.createdAt && ch.createdAt.toLowerCase().includes(q));
          const isChTitleMatch = ch.title.toLowerCase().includes(q);
          const isChContentMatch = ch.content.toLowerCase().includes(q);
          const isChPromptMatch = (ch.userNoteTrigger || '').toLowerCase().includes(q);

          if (isChTitleMatch || isChContentMatch || isChPromptMatch || (categoryFilter === 'dates' && isChDateMatch)) {
            let field = 'Contenido del Capítulo';
            let excerpt = getExcerpt(ch.content, q);
            let score = 15;

            if (isChTitleMatch) {
              field = 'Título del Capítulo';
              score = 80;
            } else if (isChContentMatch) {
              field = 'Texto del Capítulo';
              score = 45;
            } else if (isChPromptMatch) {
              field = 'Pauta / Nota de usuario';
              excerpt = getExcerpt(ch.userNoteTrigger || '', q);
              score = 35;
            } else if (isChDateMatch) {
              field = 'Fecha del Capítulo';
              excerpt = `Capítulo redactado el ${chDate}`;
              score = 25;
            }

            items.push({
              id: `chapter-${story.id}-${ch.id || chIdx}`,
              type: 'chapter',
              title: ch.title,
              subtitle: `${story.title} (Capítulo ${ch.number}) • ${world?.name || ''}`,
              matchedField: field,
              excerpt,
              dateStr: chDate,
              world: world || worlds[0],
              story,
              chapterIndex: chIdx,
              score
            });
          }
        });
      }
    });

    // Sort items by relevance score descending
    return items.sort((a, b) => b.score - a.score);
  }, [query, categoryFilter, worlds, stories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-6 rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl overflow-hidden flex flex-col text-zinc-200">
        {/* Top Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                  Buscador Global de Mundos e Historias
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Busca por contexto/lore, reglas, nombres de capítulos, contenido, títulos o fechas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar palabras clave, reglas, personajes, fragmentos de capítulos o fechas..."
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 py-3 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filtrar:
            </span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Todos ({worlds.length} mundos, {stories.length} historias)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('worlds')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'worlds'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Globe className="h-3 w-3" />
              Mundos & Contexto
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('stories')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'stories'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              Historias
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('chapters')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'chapters'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <FileText className="h-3 w-3" />
              Capítulos & Texto
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('dates')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                categoryFilter === 'dates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Calendar className="h-3 w-3" />
              Fechas
            </button>
          </div>
        </div>

        {/* Results List Section */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-3">
          {!query.trim() ? (
            <div className="text-center py-10 space-y-3">
              <Search className="h-8 w-8 text-zinc-600 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-zinc-300">
                  Explora todo el universo literario
                </p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  Escribe un término para buscar coincidencias instantáneas en las reglas de mundos, contexto, trasfondo de personajes, nombres de capítulos o fechas.
                </p>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => setQuery('reglas')}
                  className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
                >
                  📜 Reglas de mundos
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('prohibido')}
                  className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
                >
                  🛡️ Leyes prohibidas
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('Capítulo 1')}
                  className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
                >
                  📖 Capítulos iniciales
                </button>
                {worlds.flatMap(w => w.characters).slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setQuery(c.name)}
                    className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
                  >
                    👤 {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                No se encontraron resultados para "{query}"
              </p>
              <p className="text-xs text-zinc-500">
                Intenta con palabras más genéricas o cambia el filtro de categoría.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>{results.length} {results.length === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}</span>
                <span className="text-[11px] text-zinc-500">Haz clic en un resultado para abrirlo</span>
              </div>

              {results.map((item) => {
                const isWorld = item.type === 'world';
                const isStory = item.type === 'story';
                const isChapter = item.type === 'chapter';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isWorld) {
                        onNavigateToWorld(item.world);
                        onClose();
                      } else if (isStory && item.story) {
                        onNavigateToStory(item.world.id, item.story);
                        onClose();
                      } else if (isChapter && item.story && item.chapterIndex !== undefined) {
                        onNavigateToChapter(item.world.id, item.story.id, item.chapterIndex);
                        onClose();
                      }
                    }}
                    className="group cursor-pointer rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 sm:p-4 hover:border-indigo-500/50 hover:bg-zinc-900/90 transition-all shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isWorld && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                            <Globe className="h-3 w-3" /> Mundo
                          </span>
                        )}
                        {isStory && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                            <BookOpen className="h-3 w-3" /> Historia
                          </span>
                        )}
                        {isChapter && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                            <FileText className="h-3 w-3" /> Capítulo
                          </span>
                        )}

                        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
                          {item.matchedField}
                        </span>
                      </div>

                      {item.dateStr && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
                          <Clock className="h-3 w-3" />
                          {item.dateStr}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                        <span>{highlightMatch(item.title, query)}</span>
                        <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    {item.excerpt && (
                      <div className="text-xs text-zinc-300 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/60 leading-relaxed font-sans">
                        {highlightMatch(item.excerpt, query)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500">
          <span>Pulsa Escape o Cerrar para salir</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
