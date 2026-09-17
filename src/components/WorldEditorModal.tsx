import React, { useState } from 'react';
import { WorldItem, Character, CharacterRelation, RelationshipType } from '../types';
import { 
  X, 
  Globe, 
  Scroll, 
  ShieldAlert, 
  Users, 
  Plus, 
  Trash2, 
  Heart, 
  UserPlus, 
  Check, 
  AlertCircle,
  Sparkles,
  Copy,
  CheckCheck,
  Loader2,
  FileText,
  ClipboardCheck,
  HelpCircle,
  ArrowDown
} from 'lucide-react';

interface WorldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorld: (world: WorldItem) => void;
  initialWorld?: WorldItem | null;
  apiKey?: string;
  selectedModel?: string;
  hasServerKey?: boolean;
}

const CHARACTER_EXTRACTION_PROMPT = `Escribe o estructura las fichas de los personajes para una historia en el siguiente formato claro para cada uno:

Nombre: [Nombre completo o apodo del personaje]
Género: [Femenino / Masculino / No binario / Otro]
Rol: [Protagonista / Antagonista / Secundario / Misterioso]
Historia: [Pasado, trasfondo, motivaciones, traumas o secretos]
Descripción: [Rasgos físicos, personalidad y apariencia]
Relaciones:
- [Nombre de otro personaje]: [Tipo: amistad, odio, amor, amor secreto, rivalidad, familia, mentor/aprendiz, lealtad, desconfianza, alianza secreta u otro] - [Explicación detallada del vínculo entre ambos]

Asegúrate de incluir las relaciones cruzadas y dinámicas recíprocas entre los personajes.`;

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string; color: string }[] = [
  { value: 'amistad', label: 'Amistad', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'odio', label: 'Odio', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { value: 'amor', label: 'Amor', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  { value: 'amor secreto', label: 'Amor secreto', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'rivalidad', label: 'Rivalidad', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'familia', label: 'Familia', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'mentor/aprendiz', label: 'Mentor / Aprendiz', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { value: 'lealtad', label: 'Lealtad', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { value: 'desconfianza', label: 'Desconfianza', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'alianza secreta', label: 'Alianza secreta', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { value: 'otro', label: 'Otro', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' }
];

export const WorldEditorModal: React.FC<WorldEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveWorld,
  initialWorld,
  apiKey,
  selectedModel,
  hasServerKey
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialWorld?.name || '');
  const [worldRules, setWorldRules] = useState(initialWorld?.worldRules || '');
  const [forbiddenThings, setForbiddenThings] = useState(initialWorld?.forbiddenThings || '');
  const [characters, setCharacters] = useState<Character[]>(
    initialWorld?.characters || [
      {
        id: 'char-' + Date.now(),
        name: '',
        gender: 'Femenino',
        history: '',
        role: 'protagonista',
        description: '',
        relations: []
      }
    ]
  );
  const [genre, setGenre] = useState(initialWorld?.genre || '');
  const [description, setDescription] = useState(initialWorld?.description || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import section state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isParsing, setIsParsing] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Helper: Copy extraction prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CHARACTER_EXTRACTION_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch {
      // Fallback
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    }
  };

  // Helper: Process raw characters text with Gemini
  const handleParseCharacters = async () => {
    if (!importText.trim()) {
      setImportErrorMsg('Por favor pega el texto de los personajes antes de ordenar.');
      return;
    }

    setIsParsing(true);
    setImportErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const response = await fetch('/api/gemini/parse-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: importText.trim(),
          apiKey: apiKey || '',
          model: selectedModel || 'gemini-3.1-flash-lite'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar los personajes.');
      }

      const importedChars: Character[] = data.characters;

      if (!importedChars || importedChars.length === 0) {
        throw new Error('No se detectaron personajes válidos en el texto.');
      }

      if (importMode === 'replace') {
        setCharacters(importedChars);
      } else {
        // Append: remove any initial empty characters if user hasn't typed anything
        setCharacters((prev) => {
          const nonEmptyPrev = prev.filter((c) => c.name.trim().length > 0 || c.history.trim().length > 0);
          return [...nonEmptyPrev, ...importedChars];
        });
      }

      setImportSuccessMsg(`¡${importedChars.length} personajes y sus relaciones se ordenaron exitosamente!`);
      setImportText('');
    } catch (err: any) {
      console.error('Error parsing characters:', err);
      setImportErrorMsg(err?.message || 'Ocurrió un error al contactar el servicio de ordenamiento.');
    } finally {
      setIsParsing(false);
    }
  };

  // Helper: Add new empty character
  const handleAddCharacter = () => {
    const newChar: Character = {
      id: 'char-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      name: '',
      gender: 'Femenino',
      history: '',
      role: 'protagonista',
      description: '',
      relations: []
    };
    setCharacters((prev) => [...prev, newChar]);
  };

  // Helper: Update character field
  const handleUpdateCharacter = (charId: string, field: keyof Character, value: any) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, [field]: value } : c))
    );
  };

  // Helper: Delete character
  const handleDeleteCharacter = (charId: string) => {
    setCharacters((prev) =>
      prev
        .filter((c) => c.id !== charId)
        // Also remove any relations targeting this character
        .map((c) => ({
          ...c,
          relations: c.relations.filter((r) => r.targetCharacterId !== charId)
        }))
    );
  };

  // Helper: Add relation to a character
  const handleAddRelation = (sourceCharId: string) => {
    // Find candidate targets (other characters in this world)
    const otherChars = characters.filter((c) => c.id !== sourceCharId);
    if (otherChars.length === 0) {
      alert('Debes tener al menos otro personaje en el mundo para establecer una relación.');
      return;
    }

    const newRelation: CharacterRelation = {
      id: 'rel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      targetCharacterId: otherChars[0].id,
      relationshipType: 'amistad',
      notes: ''
    };

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === sourceCharId
          ? { ...c, relations: [...c.relations, newRelation] }
          : c
      )
    );
  };

  // Helper: Update relation field
  const handleUpdateRelation = (
    sourceCharId: string,
    relationId: string,
    field: keyof CharacterRelation,
    value: string
  ) => {
    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== sourceCharId) return c;
        return {
          ...c,
          relations: c.relations.map((r) =>
            r.id === relationId ? { ...r, [field]: value } : r
          )
        };
      })
    );
  };

  // Helper: Remove relation
  const handleRemoveRelation = (sourceCharId: string, relationId: string) => {
    setCharacters((prev) =>
      prev.map((c) => {
        if (c.id !== sourceCharId) return c;
        return {
          ...c,
          relations: c.relations.filter((r) => r.id !== relationId)
        };
      })
    );
  };

  const handleSave = () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa el nombre del mundo.');
      return;
    }

    // Filter out characters without names, but ensure at least 1 has name
    const validCharacters = characters.map((c, idx) => ({
      ...c,
      name: c.name.trim() || `Personaje ${idx + 1}`
    }));

    const worldToSave: WorldItem = {
      id: initialWorld?.id || 'world-' + Date.now(),
      name: name.trim(),
      genre: genre.trim() || 'Ficción / Fantasía',
      description: description.trim(),
      worldRules: worldRules.trim() || 'Reglas universales de coherencia narrativa.',
      forbiddenThings: forbiddenThings.trim() || 'Acciones prohibidas por las leyes del cosmos.',
      characters: validCharacters,
      createdAt: initialWorld?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveWorld(worldToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-[#0e1017] shadow-2xl my-6 flex flex-col max-h-[92vh] text-zinc-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 shrink-0 bg-zinc-950/60 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialWorld ? 'Editar Mundo' : 'Crear Nuevo Mundo'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Define las leyes, prohibiciones y personajes con sus relaciones interpersonales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Nombre del mundo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Nombre del mundo</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Umbralis: El Archivo de las Sombras, Neo-Sideria 2149, Eldoria..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all"
            />
          </div>

          {/* Optional Genre & Brief Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Género / Tono
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Ej: Fantasía oscura, Cyberpunk noir, Épica medieval..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Premisa / Descripción corta
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve resumen del cosmos o estado de las cosas..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Reglas del mundo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Scroll className="h-3.5 w-3.5 text-indigo-400" />
              <span>2. Reglas del mundo</span>
            </label>
            <p className="text-[11px] text-zinc-400">
              ¿Cómo funciona la realidad, la magia, el tiempo, la tecnología o el orden social en este mundo?
            </p>
            <textarea
              rows={3}
              value={worldRules}
              onChange={(e) => setWorldRules(e.target.value)}
              placeholder="1. La magia se cobra un fragmento de memoria por cada conjuro.&#10;2. La noche eterna congela cualquier metal descubierto.&#10;3. Los espejos reflejan las intenciones ocultas de quien se mira."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-y"
            />
          </div>

          {/* 3. Cosas que no se pueden hacer en el mundo / Cosas prohibidas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>3. Cosas que no se pueden hacer en el mundo (Cosas prohibidas)</span>
            </label>
            <p className="text-[11px] text-zinc-400">
              Acciones estrictamente vedadas, leyes capitales, tabúes inviolables o imposibilidades físicas y mágicas.
            </p>
            <textarea
              rows={3}
              value={forbiddenThings}
              onChange={(e) => setForbiddenThings(e.target.value)}
              placeholder="1. Prohibido encender fuego en los distritos bajos bajo pena de ceguera.&#10;2. Prohibido mirar fijamente el ojo del Inquisidor.&#10;3. No es posible resucitar a los caídos; quien lo intenta se disuelve en ceniza."
              className="w-full rounded-xl border border-rose-900/40 bg-zinc-950/80 p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/40 resize-y"
            />
          </div>

          {/* 4. Función de Personajes */}
          <div className="space-y-4 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-400" />
                  <span>4. Personajes del mundo ({characters.length})</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Fichas individuales con género, historia y relaciones interpersonales
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(!isImportOpen);
                    setImportSuccessMsg(null);
                    setImportErrorMsg(null);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow ${
                    isImportOpen
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-indigo-500/40 bg-zinc-900/90 text-indigo-300 hover:bg-zinc-800 hover:text-indigo-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Importar</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddCharacter}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Agregar personaje</span>
                </button>
              </div>
            </div>

            {/* Seccion Importar Personajes con Prompt y Auto-ordenamiento */}
            {isImportOpen && (
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 via-zinc-950/80 to-zinc-950/90 p-4 sm:p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-3 border-b border-indigo-500/20 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                        Importar personajes y relaciones
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Usa el prompt para generar o extraer la información de tus personajes y pégala aquí para ordenarla automáticamente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Botón Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsPromptOpen(!isPromptOpen)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isPromptOpen
                          ? 'border-indigo-500/60 bg-indigo-950/80 text-indigo-200'
                          : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-300'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Prompt</span>
                      <ArrowDown className={`h-3 w-3 text-zinc-400 transition-transform ${isPromptOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-200 transition-all"
                    >
                      {promptCopied ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">¡Prompt copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Copiar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Vista expandida del Prompt */}
                  {isPromptOpen && (
                    <div className="rounded-xl border border-indigo-500/20 bg-zinc-950/90 p-3.5 space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-semibold text-indigo-300">Prompt para IA:</span>
                        <span>Copia y pega esto en tu chat de IA para que redacte o estructure tus fichas</span>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-300 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80 max-h-48 overflow-y-auto">
                        {CHARACTER_EXTRACTION_PROMPT}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Rectángulo de texto para pegar */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Texto con la información de los personajes:</span>
                    {importText && (
                      <button
                        type="button"
                        onClick={() => setImportText('')}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        Limpiar texto
                      </button>
                    )}
                  </label>
                  <textarea
                    rows={5}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    disabled={isParsing}
                    placeholder="Pega aquí todo el texto obtenido con las descripciones, nombres y relaciones de tus personajes..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-y transition-all"
                  />
                </div>

                {/* Opciones de Importación y Botón de Procesamiento */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-xs text-zinc-300">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                      />
                      <span>Agregar a los existentes</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                      />
                      <span>Reemplazar lista actual</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleParseCharacters}
                    disabled={isParsing || !importText.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/20"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Ordenando personajes...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Ordenar personajes automáticamente</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mensajes de feedback */}
                {importSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in duration-150">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{importSuccessMsg}</span>
                  </div>
                )}

                {importErrorMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in duration-150">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{importErrorMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* List of Character Sheets */}
            <div className="space-y-4">
              {characters.map((char, index) => {
                const availableTargetCharacters = characters.filter((c) => c.id !== char.id);

                return (
                  <div
                    key={char.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 space-y-4 relative"
                  >
                    {/* Character Card Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-400">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">
                          Ficha de Personaje
                        </span>
                      </div>

                      {characters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCharacter(char.id)}
                          className="rounded-lg p-1 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                          title="Eliminar personaje"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Nombre, Género & Rol */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Nombre */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Nombre del personaje *
                        </label>
                        <input
                          type="text"
                          value={char.name}
                          onChange={(e) => handleUpdateCharacter(char.id, 'name', e.target.value)}
                          placeholder="Ej: Kaelen Voss, Lyra Chen..."
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Género */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Género *
                        </label>
                        <input
                          type="text"
                          value={char.gender}
                          onChange={(e) => handleUpdateCharacter(char.id, 'gender', e.target.value)}
                          placeholder="Femenino, Masculino, No binario, etc."
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Rol */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Rol / Arquetipo
                        </label>
                        <select
                          value={char.role}
                          onChange={(e) => handleUpdateCharacter(char.id, 'role', e.target.value as any)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="protagonista">Protagonista</option>
                          <option value="antagonista">Antagonista</option>
                          <option value="secundario">Secundario</option>
                          <option value="misterioso">Misterioso / Neutral</option>
                        </select>
                      </div>
                    </div>

                    {/* Historia del personaje */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-400">
                        Historia / Trasfondo del personaje
                      </label>
                      <textarea
                        rows={2}
                        value={char.history}
                        onChange={(e) => handleUpdateCharacter(char.id, 'history', e.target.value)}
                        placeholder="Orígenes, profesión, traumas pasados, motivaciones íntimas o secretos..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none resize-y"
                      />
                    </div>

                    {/* Relaciones entre personajes */}
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                          <Heart className="h-3.5 w-3.5 text-pink-400" />
                          <span>Relaciones de {char.name || 'este personaje'} con otros</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddRelation(char.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Agregar relación</span>
                        </button>
                      </div>

                      {char.relations.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 italic">
                          No se han definido relaciones todavía. Haz clic en "Agregar relación" para vincularlo con otro personaje (amistad, odio, amor, amor secreto, etc.).
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {char.relations.map((rel) => {
                            const targetChar = characters.find((c) => c.id === rel.targetCharacterId);

                            return (
                              <div
                                key={rel.id}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5 text-xs"
                              >
                                {/* Target Character selector */}
                                <div className="flex items-center gap-1 sm:w-1/3">
                                  <span className="text-zinc-500 shrink-0 text-[11px]">Hacia:</span>
                                  <select
                                    value={rel.targetCharacterId}
                                    onChange={(e) =>
                                      handleUpdateRelation(char.id, rel.id, 'targetCharacterId', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                                  >
                                    {availableTargetCharacters.map((target) => (
                                      <option key={target.id} value={target.id}>
                                        {target.name || 'Personaje sin nombre'}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Relationship Type */}
                                <div className="sm:w-1/3">
                                  <select
                                    value={rel.relationshipType}
                                    onChange={(e) =>
                                      handleUpdateRelation(char.id, rel.id, 'relationshipType', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none font-medium"
                                  >
                                    {RELATIONSHIP_TYPES.map((rt) => (
                                      <option key={rt.value} value={rt.value}>
                                        {rt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Detail note */}
                                <div className="flex-1 flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={rel.notes || ''}
                                    onChange={(e) =>
                                      handleUpdateRelation(char.id, rel.id, 'notes', e.target.value)
                                    }
                                    placeholder="Detalle o motivo (opcional)..."
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRelation(char.id, rel.id)}
                                    className="rounded-lg p-1 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors shrink-0"
                                    title="Quitar relación"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 px-6 py-4 shrink-0 bg-zinc-950/60 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
          >
            <Check className="h-4 w-4" />
            <span>Guardar Mundo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
