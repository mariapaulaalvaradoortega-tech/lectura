import React from 'react';
import { 
  X, 
  Sliders, 
  Type, 
  Check, 
  Palette, 
  AlignLeft, 
  Maximize2 
} from 'lucide-react';
import { ReaderFont, ReaderSettings, ReaderTheme } from '../types';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  settings: ReaderSettings;
  onClose: () => void;
  onUpdateSettings: (settings: ReaderSettings) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const themes: { id: ReaderTheme; name: string; bg: string; border: string; accent: string }[] = [
    { id: 'onyx', name: 'Ónix Profundo', bg: 'bg-[#0c0d10]', border: 'border-zinc-700', accent: 'text-indigo-400' },
    { id: 'midnight', name: 'Medianoche', bg: 'bg-[#0b1120]', border: 'border-blue-900', accent: 'text-sky-400' },
    { id: 'espresso', name: 'Espresso', bg: 'bg-[#14100d]', border: 'border-amber-950', accent: 'text-amber-500' },
    { id: 'charcoal', name: 'Carbón', bg: 'bg-[#121316]', border: 'border-zinc-800', accent: 'text-zinc-400' },
    { id: 'paper', name: 'Papel (Claro)', bg: 'bg-white', border: 'border-zinc-300', accent: 'text-zinc-900 font-bold' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                Ajustes de Lectura
              </h2>
              <p className="text-[11px] text-zinc-400">
                Personaliza la experiencia visual del e-reader
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

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-indigo-400" />
                <span>Tamaño de Letra</span>
              </label>
              <span className="font-mono text-xs text-indigo-400 font-bold">
                {settings.fontSize}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">A-</span>
              <input
                type="range"
                min="15"
                max="26"
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-zinc-300 font-semibold">A+</span>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-2">
              Familia Tipográfica
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontFamily: 'serif' })}
                className={`rounded-xl border p-2.5 text-center transition-all ${
                  settings.fontFamily === 'serif'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-serif'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 font-serif hover:border-zinc-700'
                }`}
              >
                <span className="block text-base font-bold">Serif</span>
                <span className="text-[10px] text-zinc-400">Literario</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontFamily: 'sans' })}
                className={`rounded-xl border p-2.5 text-center transition-all ${
                  settings.fontFamily === 'sans'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-sans'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 font-sans hover:border-zinc-700'
                }`}
              >
                <span className="block text-base font-bold">Sans</span>
                <span className="text-[10px] text-zinc-400">Moderno</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontFamily: 'mono' })}
                className={`rounded-xl border p-2.5 text-center transition-all ${
                  settings.fontFamily === 'mono'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-mono'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 font-mono hover:border-zinc-700'
                }`}
              >
                <span className="block text-base font-bold">Mono</span>
                <span className="text-[10px] text-zinc-400">Códice</span>
              </button>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-indigo-400" />
                <span>Ambiente de Lectura & Tema</span>
              </label>
              {settings.autoTimeTheme && (
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">
                  Auto Activo
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {themes.map((t) => {
                const isSelected = !settings.autoTimeTheme && settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, theme: t.id, autoTimeTheme: false })}
                    className={`rounded-xl border p-2.5 text-left transition-all ${t.bg} ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-md'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${t.accent}`}>{t.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                    </div>
                    <span className={`block h-2 w-full rounded-full ${t.id === 'paper' ? 'bg-zinc-200' : 'bg-zinc-800/80'}`} />
                  </button>
                );
              })}
            </div>

            {/* Auto Time Theme Toggle */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-zinc-200">Modo Automático (Hora Local)</span>
                <span className="block text-[11px] text-zinc-400">
                  {settings.autoTimeTheme 
                    ? 'Activo: Papel de día (6h-19h) y Ónix de noche. Toca un tema arriba para fijar uno manualmente.' 
                    : 'Activar para alternar entre papel (día) y ónix (noche) según la hora'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, autoTimeTheme: !settings.autoTimeTheme })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ml-3 ${
                  settings.autoTimeTheme ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoTimeTheme ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Line Height & Width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1">
                <AlignLeft className="h-3.5 w-3.5 text-zinc-400" />
                <span>Interlineado</span>
              </label>
              <select
                value={settings.lineHeight}
                onChange={(e) => onUpdateSettings({ ...settings, lineHeight: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="normal">Normal (1.6)</option>
                <option value="relaxed">Relajado (1.85)</option>
                <option value="loose">Amplio (2.2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1">
                <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Ancho del Lector</span>
              </label>
              <select
                value={settings.maxWidth}
                onChange={(e) => onUpdateSettings({ ...settings, maxWidth: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="narrow">Estrecho (580px)</option>
                <option value="normal">Estándar (670px)</option>
                <option value="wide">Amplio (760px)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-800 px-5 py-3.5 bg-zinc-950/60">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
