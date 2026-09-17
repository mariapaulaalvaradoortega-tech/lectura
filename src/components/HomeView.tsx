import React, { useState, useMemo } from 'react';
import { WorldItem } from '../types';
import { 
  Key as KeyIcon, 
  Plus, 
  BookOpen, 
  Users, 
  ShieldAlert, 
  Scroll, 
  Check, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3,
  Sparkles,
  Search,
  X
} from 'lucide-react';

interface HomeViewProps {
  apiKey: string;
  hasServerKey?: boolean;
  onSaveApiKey: (key: string) => void;
  worlds: WorldItem[];
  storiesCountByWorld: Record<string, number>;
  onSelectWorld: (world: WorldItem) => void;
  onCreateNewWorld: () => void;
  onEditWorld: (world: WorldItem) => void;
  onDeleteWorld: (worldId: string) => void;
  onOpenSearch?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  apiKey,
  hasServerKey = false,
  onSaveApiKey,
  worlds,
  storiesCountByWorld,
  onSelectWorld,
  onCreateNewWorld,
  onEditWorld,
  onDeleteWorld,
  onOpenSearch
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [quickWorldSearch, setQuickWorldSearch] = useState('');

  React.useEffect(() => {
    if (apiKey) {
      setLocalKey(apiKey);
    }
  }, [apiKey]);

  const handleKeySave = () => {
    onSaveApiKey(localKey.trim());
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 2500);
  };

  // Filtered worlds by quick search
  const filteredWorlds = useMemo(() => {
    const q = quickWorldSearch.trim().toLowerCase();
    if (!q) return worlds;
    return worlds.filter((w) => {
      const matchName = w.name.toLowerCase().includes(q);
      const matchDesc = (w.description || '').toLowerCase().includes(q);
      const matchGenre = (w.genre || '').toLowerCase().includes(q);
      const matchRules = (w.worldRules || '').toLowerCase().includes(q);
      const matchForbidden = (w.forbiddenThings || '').toLowerCase().includes(q);
      const matchChars = w.characters.some(
        c => c.name.toLowerCase().includes(q) || (c.history || '').toLowerCase().includes(q)
      );
      return matchName || matchDesc || matchGenre || matchRules || matchForbidden || matchChars;
    });
  }, [worlds, quickWorldSearch]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Banner / Brand: "Lectura" */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                Lectura
              </h1>
              <p className="text-[11px] text-zinc-400">
                Portal de Mundos, Historias y Creación Literaria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-indigo-500/50 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                title="Buscador global por contexto, capítulos, fechas o historias"
              >
                <Search className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Buscar en mundos</span>
              </button>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              PWA E-Reader
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-10">
        {/* Strictly required Key Section */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-sm shadow-xl transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <KeyIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
                  Key
                </h2>
                <p className="text-xs text-zinc-400">
                  Ingresa tu clave de Gemini API para redactar capítulos y mundos. Se almacena localmente en tu navegador.
                </p>
              </div>
            </div>

            {apiKey ? (
              <span className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Guardada
              </span>
            ) : hasServerKey ? (
              <span className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Activa en Servidor
              </span>
            ) : (
              <span className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
                Pendiente
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder={hasServerKey ? "Clave de entorno detectada (o pega otra para sobrescribir)" : "Pega aquí tu API Key (AIzaSy...)"}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 py-2.5 pl-3.5 pr-11 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                title={showKey ? 'Ocultar' : 'Mostrar'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleKeySave}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Guardar Key</span>
            </button>
          </div>

          {keySavedToast && (
            <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-200">
              <Check className="h-3.5 w-3.5" />
              Key actualizada con éxito en tu dispositivo.
            </p>
          )}
        </section>

        {/* Global Multi-Criteria Search Banner for Worlds */}
        <section className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-indigo-950/20 p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                  Búsqueda por Mundos, Capítulos, Contexto y Fechas
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Encuentra al instante información por reglas de mundos, contexto/lore, nombres de capítulos, títulos o fechas.
              </p>
            </div>

            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/90 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-indigo-500 hover:border-indigo-400 transition-all self-start sm:self-auto shrink-0"
              >
                <Search className="h-4 w-4" />
                <span>Abrir Buscador Global</span>
              </button>
            )}
          </div>

          {/* Quick inline search input */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={quickWorldSearch}
              onChange={(e) => setQuickWorldSearch(e.target.value)}
              placeholder="Filtrar mundos por nombre, reglas, género, contexto o personajes..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-9 pr-9 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all"
            />
            {quickWorldSearch && (
              <button
                type="button"
                onClick={() => setQuickWorldSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Section: "Selecciona un mundo" + Button "Crear nuevo mundo" */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <span>Selecciona un mundo</span>
                <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400 font-normal">
                  {filteredWorlds.length} de {worlds.length} {worlds.length === 1 ? 'disponible' : 'disponibles'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Elige un mundo para explorar sus historias o crea uno con sus propias reglas y personajes.
              </p>
            </div>

            <button
              type="button"
              onClick={onCreateNewWorld}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/90 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:border-indigo-400 active:scale-[0.98] transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Crear nuevo mundo</span>
            </button>
          </div>

          {/* Worlds Grid */}
          {filteredWorlds.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                No se encontraron mundos que coincidan con "{quickWorldSearch}"
              </p>
              <p className="text-xs text-zinc-500">
                Puedes limpiar el filtro o usar el Buscador Global para buscar en los capítulos e historias.
              </p>
              <button
                type="button"
                onClick={() => setQuickWorldSearch('')}
                className="mt-2 text-xs font-semibold text-indigo-400 hover:underline"
              >
                Mostrar todos los mundos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {filteredWorlds.map((world) => {
                const storiesCount = storiesCountByWorld[world.id] || 0;
                return (
                  <div
                    key={world.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 sm:p-6 backdrop-blur-sm hover:border-indigo-500/50 hover:bg-zinc-900/80 transition-all duration-200 shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Title & Action buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                            {world.genre || 'Mundo Literario'}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                            {world.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditWorld(world);
                            }}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                            title="Editar mundo (nombre, reglas, cosas prohibidas, personajes)"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {worlds.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Seguro que deseas eliminar el mundo "${world.name}"?`)) {
                                  onDeleteWorld(world.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                              title="Eliminar mundo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* World Description */}
                      {world.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {world.description}
                        </p>
                      )}

                      {/* Rules & Prohibited Teaser */}
                      <div className="space-y-1.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                          <Scroll className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>Reglas:</span>
                          <span className="text-zinc-400 truncate font-normal">
                            {world.worldRules.split('\n')[0] || 'Leyes del cosmos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                          <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <span>Prohibido:</span>
                          <span className="text-zinc-400 truncate font-normal">
                            {world.forbiddenThings.split('\n')[0] || 'Acciones vedadas'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Stats & Clickable Trigger */}
                    <div className="mt-5 pt-3.5 border-t border-zinc-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-indigo-400" />
                          {world.characters.length} {world.characters.length === 1 ? 'personaje' : 'personajes'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                          {storiesCount} {storiesCount === 1 ? 'historia' : 'historias'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectWorld(world)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/50 px-3 py-1.5 text-xs font-medium text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all shadow"
                      >
                        <span>Entrar al mundo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
