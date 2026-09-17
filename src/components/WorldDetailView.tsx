import React, { useState } from 'react';
import { WorldItem, StoryItem, Character } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Users, 
  Scroll, 
  ShieldAlert, 
  Calendar, 
  Trash2, 
  Sparkles, 
  Check, 
  Edit3,
  Feather,
  Heart,
  UserCheck,
  HelpCircle,
  Clock,
  Search
} from 'lucide-react';

interface WorldDetailViewProps {
  world: WorldItem;
  stories: StoryItem[];
  onBackToHome: () => void;
  onSelectStory: (story: StoryItem) => void;
  onCreateStory: (newStory: {
    title: string;
    description: string;
    involvedCharacterIds: string[];
    initialChapterTitle?: string;
    initialInstruction?: string;
  }) => Promise<void>;
  onEditWorld: (world: WorldItem) => void;
  onDeleteStory: (storyId: string) => void;
  onOpenSearch?: () => void;
  isGeneratingStory: boolean;
}

export const WorldDetailView: React.FC<WorldDetailViewProps> = ({
  world,
  stories,
  onBackToHome,
  onSelectStory,
  onCreateStory,
  onEditWorld,
  onDeleteStory,
  onOpenSearch,
  isGeneratingStory
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(
    world.characters.map((c) => c.id) // Default: all characters selected
  );
  const [initialChapterTitle, setInitialChapterTitle] = useState('');
  const [initialInstruction, setInitialInstruction] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Toggle single character
  const handleToggleChar = (charId: string) => {
    setSelectedCharIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  // Select All button
  const handleSelectAllChars = () => {
    setSelectedCharIds(world.characters.map((c) => c.id));
  };

  // Clear Selection button
  const handleClearSelection = () => {
    setSelectedCharIds([]);
  };

  // Handle Create Story Submit
  const handleCreateStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!storyTitle.trim()) {
      setFormError('Por favor asigna un título a la historia.');
      return;
    }

    if (selectedCharIds.length === 0) {
      setFormError('Debes seleccionar al menos un personaje involucrado.');
      return;
    }

    try {
      await onCreateStory({
        title: storyTitle.trim(),
        description: storyDescription.trim(),
        involvedCharacterIds: selectedCharIds,
        initialChapterTitle: initialChapterTitle.trim() || undefined,
        initialInstruction: initialInstruction.trim() || undefined
      });
      setIsCreateModalOpen(false);
      setStoryTitle('');
      setStoryDescription('');
      setInitialChapterTitle('');
      setInitialInstruction('');
    } catch (err: any) {
      setFormError(err?.message || 'Error al iniciar la historia.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-200 selection:bg-indigo-500/30 selection:text-indigo-200 pb-16">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Mundos</span>
            </button>

            <div className="hidden sm:block h-4 w-px bg-zinc-800" />

            <div>
              <span className="text-[11px] font-mono text-indigo-400 block sm:inline mr-2">
                {world.genre || 'Mundo'}
              </span>
              <h1 className="font-serif text-base sm:text-lg font-bold text-zinc-100 inline">
                {world.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Buscar capítulos, historias, fechas o contexto de este y otros mundos"
              >
                <Search className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Buscar en mundos</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEditWorld(world)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Editar reglas, cosas prohibidas y personajes"
            >
              <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Editar Mundo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-8">
        {/* World Quick Info Card */}
        <section className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">{world.name}</h2>
              {world.description && (
                <p className="text-xs text-zinc-400 mt-0.5">{world.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1">
                <Users className="h-3 w-3 text-indigo-400" />
                {world.characters.length} personajes
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1">
                <BookOpen className="h-3 w-3 text-purple-400" />
                {stories.length} historias
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Reglas del mundo */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                <Scroll className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Reglas del mundo</span>
              </div>
              <p className="text-zinc-400 leading-relaxed whitespace-pre-line text-[11px]">
                {world.worldRules || 'Sin reglas especificadas.'}
              </p>
            </div>

            {/* Cosas prohibidas */}
            <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Cosas que no se pueden hacer (Prohibidas)</span>
              </div>
              <p className="text-zinc-400 leading-relaxed whitespace-pre-line text-[11px]">
                {world.forbiddenThings || 'Sin prohibiciones registradas.'}
              </p>
            </div>
          </div>

          {/* Characters Preview in this world */}
          <div className="pt-1">
            <h3 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Personajes de este mundo:</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {world.characters.map((char) => (
                <div
                  key={char.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-xs text-zinc-300"
                >
                  <span className="font-medium text-zinc-200">{char.name}</span>
                  <span className="text-[10px] text-zinc-500">({char.gender})</span>
                  {char.relations.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-pink-400 font-mono">
                      <Heart className="h-2.5 w-2.5" />
                      {char.relations.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stories Section: "Continuar una historia de las ya escritas" + "Crear nueva historia" */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>Historias de este mundo</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 font-normal">
                  {stories.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Continúa una historia de las ya escritas o crea una nueva definiendo sus personajes involucrados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedCharIds(world.characters.map((c) => c.id));
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Crear nueva historia</span>
            </button>
          </div>

          {/* Stories List */}
          {stories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center space-y-3">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Feather className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  No hay historias escritas en este mundo todavía
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Crea la primera historia en este mundo. Podrás definir su título, descripción y seleccionar los personajes que participarán.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCharIds(world.characters.map((c) => c.id));
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Crear la primera historia</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story) => {
                const involvedChars = world.characters.filter((c) =>
                  story.involvedCharacterIds.includes(c.id)
                );

                return (
                  <div
                    key={story.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 backdrop-blur-sm hover:border-indigo-500/50 hover:bg-zinc-900/80 transition-all duration-200 shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                            {story.chapters.length} {story.chapters.length === 1 ? 'capítulo' : 'capítulos'}
                          </span>
                          <h3 className="text-base font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                            {story.title}
                          </h3>
                        </div>

                        {stories.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Seguro que deseas eliminar la historia "${story.title}"?`)) {
                                onDeleteStory(story.id);
                              }
                            }}
                            className="rounded-lg p-1 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors shrink-0"
                            title="Eliminar historia"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {story.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {story.description}
                        </p>
                      )}

                      {/* Involved Characters chips */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                          Personajes involucrados:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {involvedChars.length > 0 ? (
                            involvedChars.map((c) => (
                              <span
                                key={c.id}
                                className="rounded-md border border-zinc-800 bg-zinc-950/70 px-2 py-0.5 text-[11px] text-zinc-300"
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-zinc-500">
                              Todos los del mundo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Capítulo actual: {story.currentChapterIndex + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectStory(story)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/50 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow"
                      >
                        <Feather className="h-3.5 w-3.5" />
                        <span>Continuar lectura</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal: "Crear Nueva Historia" */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#0e1017] shadow-2xl my-6 flex flex-col max-h-[92vh] text-zinc-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 shrink-0 bg-zinc-950/60 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Feather className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Crear Nueva Historia</h2>
                  <p className="text-[11px] text-zinc-400">En el mundo: {world.name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateStorySubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
              {formError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              {/* Título de la historia */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Título de la historia *
                </label>
                <input
                  type="text"
                  required
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Ej: El Susurro de las Sombras, La Rebelión de los Enanos..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Descripción de la historia */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Descripción / Sinopsis de la trama
                </label>
                <textarea
                  rows={2}
                  value={storyDescription}
                  onChange={(e) => setStoryDescription(e.target.value)}
                  placeholder="De qué tratará esta aventura o conflicto..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none resize-y"
                />
              </div>

              {/* Personajes involucrados: "Hay un botón que dice todos los personajes o seleccionar y pam, seleccionan" */}
              <div className="space-y-3 pt-1 border-t border-zinc-800/70">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                      Personajes involucrados *
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      {selectedCharIds.length} de {world.characters.length} seleccionados
                    </span>
                  </div>

                  {/* Buttons: Todos los personajes / Limpiar */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllChars}
                      className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-900/50 transition-colors"
                    >
                      Todos los personajes
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                {/* Character selection list with toggle cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {world.characters.map((char) => {
                    const isSelected = selectedCharIds.includes(char.id);

                    return (
                      <button
                        type="button"
                        key={char.id}
                        onClick={() => handleToggleChar(char.id)}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-500/70 bg-indigo-950/30 text-zinc-100'
                            : 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600 text-white'
                              : 'border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs truncate">
                              {char.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 capitalize">
                              {char.gender}
                            </span>
                          </div>
                          {char.history && (
                            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                              {char.history}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Chapter 1 trigger */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Título del Capítulo 1 (opcional)
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Si se omite, se generará a partir del contenido
                  </span>
                </div>
                <input
                  type="text"
                  value={initialChapterTitle}
                  onChange={(e) => setInitialChapterTitle(e.target.value)}
                  placeholder="Ej: La Chispa en la Penumbra"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />

                <label className="text-xs font-semibold text-zinc-300 block pt-1">
                  Pauta o escena de arranque
                </label>
                <textarea
                  rows={2}
                  value={initialInstruction}
                  onChange={(e) => setInitialInstruction(e.target.value)}
                  placeholder="Ej: Comienza presentando el conflicto en la plaza principal mientras suena la campana de toque de queda..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none resize-y"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isGeneratingStory}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  <Feather className="h-4 w-4" />
                  <span>{isGeneratingStory ? 'Redactando Capítulo 1...' : 'Comenzar Historia'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
