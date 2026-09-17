import React, { useState } from 'react';
import { X, BookOpen, Download, Copy, Check, FileText } from 'lucide-react';
import { StoryItem, WorldItem } from '../types';

interface ExportIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  worlds: WorldItem[];
  showToast: (msg: string) => void;
}

export const ExportIndexModal: React.FC<ExportIndexModalProps> = ({
  isOpen,
  onClose,
  stories,
  worlds,
  showToast
}) => {
  if (!isOpen) return null;

  const [selectedStoryId, setSelectedStoryId] = useState<string>(stories[0]?.id || '');
  const [exportScope, setExportScope] = useState<'all' | 'single'>('all');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [includePrompt, setIncludePrompt] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  const currentStory = stories.find((s) => s.id === selectedStoryId) || stories[0];
  const currentWorld = worlds.find((w) => w.id === currentStory?.worldId);

  // Generate export text
  const generateExportText = () => {
    if (!currentStory) return '';

    let text = `# ${currentStory.title}\n`;
    if (currentWorld) {
      text += `Mundo: ${currentWorld.name} (${currentWorld.genre})\n`;
    }
    text += `Descripción: ${currentStory.description}\n`;
    text += `========================================\n\n`;

    const chaptersToExport =
      exportScope === 'single'
        ? [currentStory.chapters[selectedChapterIndex]].filter(Boolean)
        : currentStory.chapters;

    chaptersToExport.forEach((chap) => {
      text += `## ${chap.title}\n`;
      text += `Palabras: ${chap.wordCount || chap.content.split(/\s+/).length}\n`;
      if (includePrompt && chap.userNoteTrigger) {
        text += `\n[Prompt / Directriz de creación]:\n"${chap.userNoteTrigger}"\n`;
      }
      text += `\n${chap.content}\n`;
      text += `\n----------------------------------------\n\n`;
    });

    return text;
  };

  const exportText = generateExportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    showToast('Texto copiado al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStory.title.toLowerCase().replace(/\s+/g, '-')}-export.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Archivo descargado con éxito.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Índice e Historial de Exportación
              </h2>
              <p className="text-xs text-zinc-400">
                Selecciona historias, capítulos y formato de exportación
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Story Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Historia a Exportar
            </label>
            <select
              value={selectedStoryId}
              onChange={(e) => {
                setSelectedStoryId(e.target.value);
                setSelectedChapterIndex(0);
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              {stories.map((s) => {
                const w = worlds.find((w) => w.id === s.worldId);
                return (
                  <option key={s.id} value={s.id}>
                    {s.title} {w ? `(${w.name})` : ''} — {s.chapters.length} capítulos
                  </option>
                );
              })}
            </select>
          </div>

          {/* Export Scope & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Alcance del Contenido
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    exportScope === 'all'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Toda la Historia ({currentStory?.chapters.length || 0} caps)
                </button>
                <button
                  type="button"
                  onClick={() => setExportScope('single')}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    exportScope === 'single'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Capítulo Específico
                </button>
              </div>
            </div>

            {exportScope === 'single' && currentStory && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Seleccionar Capítulo
                </label>
                <select
                  value={selectedChapterIndex}
                  onChange={(e) => setSelectedChapterIndex(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                >
                  {currentStory.chapters.map((chap, idx) => (
                    <option key={chap.id} value={idx}>
                      Cap. {chap.number}: {chap.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Prompt Inclusion Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <div>
              <span className="block text-xs font-semibold text-zinc-200">Incluir Prompt / Directrices de IA</span>
              <span className="block text-[11px] text-zinc-400">Si se activa, incluye las órdenes y notas usadas para generar cada capítulo</span>
            </div>
            <button
              type="button"
              onClick={() => setIncludePrompt(!includePrompt)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includePrompt ? 'bg-indigo-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  includePrompt ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                <span>Vista Previa del Archivo ({exportText.split(/\s+/).length} palabras)</span>
              </label>
            </div>
            <textarea
              readOnly
              value={exportText}
              rows={8}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 focus:outline-none resize-none select-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-4 bg-zinc-950/80">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
            >
              <Download className="h-4 w-4" />
              <span>Descargar .md / .txt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
