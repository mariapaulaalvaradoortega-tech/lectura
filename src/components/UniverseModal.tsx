import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Globe, 
  Heart, 
  Scroll, 
  ShieldAlert, 
  UserPlus, 
  Plus, 
  Trash2,
  Check
} from 'lucide-react';
import { Character, WorldItem, CharacterRelation, RelationshipType } from '../types';

interface UniverseModalProps {
  isOpen: boolean;
  world: WorldItem;
  characters: Character[];
  onClose: () => void;
  onSaveWorldDetails?: (updatedWorld: WorldItem) => void;
}

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'amistad', label: 'Amistad' },
  { value: 'odio', label: 'Odio' },
  { value: 'amor', label: 'Amor' },
  { value: 'amor secreto', label: 'Amor secreto' },
  { value: 'rivalidad', label: 'Rivalidad' },
  { value: 'familia', label: 'Familia' },
  { value: 'mentor/aprendiz', label: 'Mentor / Aprendiz' },
  { value: 'lealtad', label: 'Lealtad' },
  { value: 'desconfianza', label: 'Desconfianza' },
  { value: 'alianza secreta', label: 'Alianza secreta' },
  { value: 'otro', label: 'Otro' }
];

export const UniverseModal: React.FC<UniverseModalProps> = ({
  isOpen,
  world,
  characters,
  onClose,
  onSaveWorldDetails
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'lore'>('characters');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#0e1017] shadow-2xl my-6 flex flex-col max-h-[90vh] text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 shrink-0 bg-zinc-950/60 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Fichas de Personajes & Reglas del Mundo
              </h2>
              <p className="text-[11px] text-zinc-400">
                {world.name}
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

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'characters'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Personajes & Relaciones ({characters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lore')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'lore'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Scroll className="h-3.5 w-3.5" />
            <span>Reglas & Cosas Prohibidas</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {activeTab === 'characters' ? (
            <div className="space-y-4">
              {characters.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-6">
                  No hay personajes registrados en este mundo.
                </p>
              ) : (
                characters.map((char) => (
                  <div
                    key={char.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-100">{char.name}</h3>
                          <span className="rounded-full border border-indigo-500/30 bg-indigo-950/50 px-2 py-0.5 text-[10px] text-indigo-300 capitalize">
                            {char.role}
                          </span>
                          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
                            Género: {char.gender}
                          </span>
                        </div>
                        {char.archetype && (
                          <p className="text-[11px] text-zinc-400 mt-0.5 italic">
                            {char.archetype}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Historia */}
                    {char.history && (
                      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2.5 text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-400 block mb-1 text-[11px]">
                          Historia & Trasfondo:
                        </span>
                        <p className="leading-relaxed whitespace-pre-line text-[11px]">
                          {char.history}
                        </p>
                      </div>
                    )}

                    {/* Relaciones */}
                    {char.relations && char.relations.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                          <Heart className="h-3 w-3 text-pink-400" />
                          <span>Relaciones con otros personajes:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {char.relations.map((rel) => {
                            const target = characters.find((c) => c.id === rel.targetCharacterId);
                            const targetName = target ? target.name : 'Personaje';

                            return (
                              <span
                                key={rel.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-200"
                              >
                                <span>Con <strong className="text-zinc-100">{targetName}</strong>:</span>
                                <span className="font-medium text-indigo-400 capitalize">
                                  {rel.relationshipType}
                                </span>
                                {rel.notes && (
                                  <span className="text-zinc-500 italic truncate max-w-[150px]">
                                    ({rel.notes})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reglas */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
                  <Scroll className="h-4 w-4 text-indigo-400" />
                  <span>Reglas del Mundo</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {world.worldRules || 'Sin reglas especificadas.'}
                </p>
              </div>

              {/* Cosas prohibidas */}
              <div className="rounded-xl border border-rose-900/40 bg-rose-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>Cosas que no se pueden hacer en el mundo (Prohibidas)</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {world.forbiddenThings || 'Sin prohibiciones registradas.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-800/80 px-6 py-3.5 shrink-0 bg-zinc-950/60 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
