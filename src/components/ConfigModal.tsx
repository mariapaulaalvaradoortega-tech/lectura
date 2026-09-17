import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Database,
  ExternalLink
} from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  apiKey: string;
  selectedModel: string;
  onClose: () => void;
  onSaveConfig: (newKey: string, newModel: string) => void;
  onExportAllData: () => void;
  onResetAllData: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  apiKey,
  selectedModel,
  onClose,
  onSaveConfig,
  onExportAllData,
  onResetAllData
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(() => {
    if (!selectedModel || selectedModel.includes('1.5') || selectedModel.includes('2.0') || selectedModel.includes('2.5') || selectedModel === 'gemini-pro' || selectedModel === 'gemini-3.8-flash') {
      return 'gemini-3.1-flash-lite';
    }
    return selectedModel;
  });
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localKey.trim(), localModel);
    onClose();
  };

  const modelOptions = [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Recomendado - Máxima velocidad y disponibilidad)' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (Versión estándar más reciente)' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Alta fidelidad - Sujeto a alta demanda)' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Prosa densa y tramas complejas)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0e1017] shadow-2xl my-6 flex flex-col text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-950/60 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Configuración & Key</h2>
              <p className="text-[11px] text-zinc-400">Gemini API y Almacenamiento Local</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Key (Gemini API Key)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                <span>Obtener en Google AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-3.5 pr-10 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Guardada exclusivamente en tu navegador (localStorage).</span>
            </div>
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Modelo de Generación
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              {modelOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Local Data & Backup */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-indigo-400" />
                <span>Copia de seguridad</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportAllData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                <span>Exportar datos (.json)</span>
              </button>

              <button
                type="button"
                onClick={onResetAllData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/40 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                <span>Restablecer mundos iniciales</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800/80 px-6 py-4 bg-zinc-950/60 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
          >
            <Check className="h-4 w-4" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
