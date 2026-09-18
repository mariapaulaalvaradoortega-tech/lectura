import React, { useState, useEffect } from 'react';
import { WorldItem, StoryItem, Chapter, ChapterVersion, ReaderSettings, getEffectiveReaderTheme } from './types';
import { initialWorlds, initialStories, defaultReaderSettings } from './initialData';
import { HomeView } from './components/HomeView';
import { WorldEditorModal } from './components/WorldEditorModal';
import { WorldDetailView } from './components/WorldDetailView';
import { Header } from './components/Header';
import { ReaderView, StyleOption } from './components/ReaderView';
import { CommentBox } from './components/CommentBox';
import { UniverseModal } from './components/UniverseModal';
import { ConfigModal } from './components/ConfigModal';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { ExportIndexModal } from './components/ExportIndexModal';
import { WorldSearchModal } from './components/WorldSearchModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEYS = {
  API_KEY: 'lector_gemini_api_key_v2',
  WORLDS: 'lector_worlds_v2',
  STORIES: 'lector_stories_v2',
  SETTINGS: 'lector_reader_settings_v2',
  MODEL: 'lector_selected_model_v2'
};

export default function App() {
  // 1. Core State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODEL);
    if (!saved || saved.includes('1.5') || saved.includes('2.0') || saved.includes('2.5') || saved === 'gemini-pro' || saved === 'gemini-3.8-flash') {
      return 'gemini-3.1-flash-lite';
    }
    return saved;
  });

  const [hasServerKey, setHasServerKey] = useState(false);

  // Check if server environment has GEMINI_API_KEY
  useEffect(() => {
    fetch('/api/gemini/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasServerKey) {
          setHasServerKey(true);
        }
      })
      .catch(() => {});
  }, []);

  const [worlds, setWorlds] = useState<WorldItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORLDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved worlds:', e);
    }
    return initialWorlds;
  });

  const [stories, setStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved stories:', e);
    }
    return initialStories;
  });

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...defaultReaderSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse saved settings:', e);
    }
    return defaultReaderSettings;
  });

  // 2. Navigation State
  const [activeWorldId, setActiveWorldId] = useState<string | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  // 3. Modals State
  const [isWorldEditorOpen, setIsWorldEditorOpen] = useState(false);
  const [worldToEdit, setWorldToEdit] = useState<WorldItem | null>(null);
  const [isUniverseModalOpen, setIsUniverseModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isExportIndexOpen, setIsExportIndexOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // 4. UI Indicators
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Search Navigation Handlers
  const handleNavigateToWorld = (world: WorldItem) => {
    setActiveWorldId(world.id);
    setActiveStoryId(null);
    setIsSearchModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToStory = (worldId: string, story: StoryItem) => {
    setActiveWorldId(worldId);
    setActiveStoryId(story.id);
    setIsSearchModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToChapter = (worldId: string, storyId: string, chapterIndex: number) => {
    setActiveWorldId(worldId);
    setActiveStoryId(storyId);
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, currentChapterIndex: chapterIndex } : s))
    );
    setIsSearchModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-save to localStorage
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
        localStorage.setItem(STORAGE_KEYS.WORLDS, JSON.stringify(worlds));
        localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(readerSettings));
        localStorage.setItem(STORAGE_KEYS.MODEL, selectedModel);
      } catch (err) {
        console.error('Failed to auto-save to localStorage:', err);
      } finally {
        setIsSaving(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [apiKey, worlds, stories, readerSettings, selectedModel]);

  // Scroll reading progress
  useEffect(() => {
    if (!activeStoryId) return;

    const handleScroll = () => {
      const doc = document.documentElement;
      const totalDocHeight = doc.scrollHeight - doc.clientHeight;
      if (totalDocHeight <= 0) {
        setReadingProgress(0);
        return;
      }
      const progress = (window.scrollY / totalDocHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeStoryId]);

  // Derived current world and story
  const activeWorld = worlds.find((w) => w.id === activeWorldId) || null;
  const activeStory = stories.find((s) => s.id === activeStoryId) || null;

  // Active story chapters
  const currentChapterIndex = activeStory?.currentChapterIndex ?? 0;
  const currentChapter = activeStory?.chapters[currentChapterIndex] || 
    activeStory?.chapters[0] || {
      id: 'default',
      number: 1,
      title: 'Capítulo 1',
      content: 'Cargando contenido...',
      createdAt: new Date().toISOString(),
      wordCount: 0
    };

  // Stories count map by world
  const storiesCountByWorld = worlds.reduce((acc, w) => {
    acc[w.id] = stories.filter((s) => s.worldId === w.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Save API Key handler
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    showToast('Key guardada localmente.');
  };

  // World creation or update handler
  const handleSaveWorld = (worldToSave: WorldItem) => {
    setWorlds((prev) => {
      const exists = prev.some((w) => w.id === worldToSave.id);
      if (exists) {
        return prev.map((w) => (w.id === worldToSave.id ? worldToSave : w));
      }
      return [worldToSave, ...prev];
    });
    showToast(`Mundo "${worldToSave.name}" guardado.`);
  };

  // Delete world handler
  const handleDeleteWorld = (worldId: string) => {
    setWorlds((prev) => prev.filter((w) => w.id !== worldId));
    setStories((prev) => prev.filter((s) => s.worldId !== worldId));
    if (activeWorldId === worldId) setActiveWorldId(null);
    if (activeStory && activeStory.worldId === worldId) setActiveStoryId(null);
    showToast('Mundo e historias eliminados.');
  };

  // Delete story handler
  const handleDeleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    if (activeStoryId === storyId) setActiveStoryId(null);
    showToast('Historia eliminada.');
  };

  // Generation Engine
  const executeGeneration = async ({
    world,
    storyTitle,
    chapterTitle,
    userNote,
    chapterNumber,
    involvedCharacterIds,
    previousChapterText
  }: {
    world: WorldItem;
    storyTitle: string;
    chapterTitle?: string;
    userNote: string;
    chapterNumber: number;
    involvedCharacterIds: string[];
    previousChapterText: string;
  }): Promise<{ title: string; content: string; suggestions?: string[] }> => {
    const key = apiKey.trim();

    // 1. Build rich world context including rules and forbidden things
    const universeContext = `[MUNDO]: ${world.name}
[GÉNERO]: ${world.genre || 'Fantasía / Ficción'}
[PREMISA / DESCRIPCIÓN]: ${world.description || ''}

[REGLAS DEL MUNDO]:
${world.worldRules || 'Leyes de coherencia narrativa.'}

[COSAS QUE NO SE PUEDEN HACER EN ESTE MUNDO (COSAS PROHIBIDAS)]:
${world.forbiddenThings || 'Leyes sagradas y acciones terminantemente vedadas.'}`;

    // 2. Build character context with gender, history, and interpersonal relationships
    const involvedChars = world.characters.filter((c) =>
      involvedCharacterIds.includes(c.id)
    );

    const charactersContext = involvedChars
      .map((c) => {
        const relationsList = c.relations && c.relations.length > 0
          ? c.relations
              .map((r) => {
                const target = world.characters.find((tc) => tc.id === r.targetCharacterId);
                const targetName = target ? target.name : 'otro personaje';
                return `    • Con ${targetName}: ${r.relationshipType}${r.notes ? ` (${r.notes})` : ''}`;
              })
              .join('\n')
          : '    • Sin relaciones conflictivas registradas aún.';

        return `• [PERSONAJE]: ${c.name}
  - Género: ${c.gender}
  - Rol: ${c.role} ${c.archetype ? `(${c.archetype})` : ''}
  - Historia / Trasfondo: ${c.history || c.description || 'Sin detalles'}
  - Relaciones interpersonales:
${relationsList}`;
      })
      .join('\n\n');

    let resultTitle = chapterTitle?.trim() || `Capítulo ${chapterNumber}`;
    let resultContent = '';
    let resultSuggestions: string[] = [];
    let serverSucceeded = false;
    let serverErrorMsg = '';

    // Server API Attempt
    try {
      const response = await fetch('/api/gemini/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key || undefined,
          storyTitle,
          chapterTitle: chapterTitle?.trim() || undefined,
          universeContext,
          charactersContext,
          previousChapter: previousChapterText,
          userNote: userNote || 'Desarrolla la escena respetando las reglas del mundo y las relaciones.',
          chapterNumber,
          model: selectedModel || 'gemini-3.1-flash-lite'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          resultTitle = data.title || (chapterTitle?.trim() ? `Capítulo ${chapterNumber}: ${chapterTitle.trim()}` : `Capítulo ${chapterNumber}`);
          resultContent = data.content;
          if (Array.isArray(data.suggestions)) {
            resultSuggestions = data.suggestions;
          }
          serverSucceeded = true;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        serverErrorMsg = errData?.error || `Error del servidor (${response.status})`;
      }
    } catch (e: any) {
      serverErrorMsg = e?.message || 'Error de conexión con el servidor.';
      console.warn('Server proxy failed, trying direct client REST fallback:', e);
    }

    // Direct REST Fallback
    if (!serverSucceeded) {
      if (!key) {
        throw new Error(serverErrorMsg || 'Por favor ingresa y guarda tu Key en la pantalla principal.');
      }

      const titleInstruction = chapterTitle && chapterTitle.trim()
        ? `El título para este capítulo ha sido fijado como: "${chapterTitle.trim()}". La primera línea del texto DEBE ser obligatoriamente: "# Capítulo ${chapterNumber}: ${chapterTitle.trim()}".`
        : `El usuario no ha indicado un título para este capítulo. Analiza el contenido y genera un título evocador e intrigante. La primera línea del texto DEBE ser: "# Capítulo ${chapterNumber}: [Título Generado]".`;

      const prompt = `Eres un aclamado autor de literatura de ficción inmersiva en español para la obra "${storyTitle}".
Escribe el Capítulo ${chapterNumber} completo con prosa cuidada, inmersiva, elegante y vívida.
${titleInstruction}
No agregues notas meta, saludos ni mensajes sobre la autoría; únicamente la prosa literaria lista para leer.
AL FINAL DEL CAPÍTULO, incluye obligatoriamente 3 sugerencias para el siguiente capítulo delimitadas así:
[SUGERENCIAS_CONTINUACION]
- Sugerencia 1...
- Sugerencia 2...
- Sugerencia 3...
[/SUGERENCIAS_CONTINUACION]

${universeContext}

[FICHAS DE PERSONAJES Y SUS RELACIONES]:
${charactersContext}

[CAPÍTULO ANTERIOR]:
${previousChapterText || 'Inicio de la historia (primer capítulo).'}

[INSTRUCCIÓN / NOTA PARA ESTE CAPÍTULO]:
"${userNote || 'Comienza o avanza la narración profundizando en el conflicto central.'}"`;

      const sanitizeModel = (m?: string): string => {
        if (!m || m.includes('1.5') || m.includes('2.0') || m.includes('2.5') || m === 'gemini-pro') {
          return 'gemini-3.1-flash-lite';
        }
        return m;
      };

      const candidateModels = Array.from(
        new Set([
          sanitizeModel(selectedModel),
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash'
        ])
      );
      let data = null;
      let lastErrorMsg = '';

      for (const m of candidateModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 2800
              }
            })
          });

          if (res.ok) {
            data = await res.json();
            break;
          } else {
            const errData = await res.json().catch(() => ({}));
            lastErrorMsg = errData?.error?.message || `Error ${res.status}`;
          }
        } catch (e: any) {
          lastErrorMsg = e?.message || 'Error de red';
        }
      }

      if (!data) {
        throw new Error(lastErrorMsg || serverErrorMsg || 'Error al conectar con la API de Gemini.');
      }

      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('La respuesta recibida no contiene texto.');
      }

      const suggMatch = text.match(/\[SUGERENCIAS_CONTINUACION\]([\s\S]*?)\[\/SUGERENCIAS_CONTINUACION\]/i);
      if (suggMatch) {
        resultSuggestions = suggMatch[1]
          .split('\n')
          .map((s: string) => s.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter((s: string) => s.length > 5)
          .slice(0, 3);
        text = text.replace(/\[SUGERENCIAS_CONTINUACION\][\s\S]*?\[\/SUGERENCIAS_CONTINUACION\]/i, '').trim();
      }

      const lines = text.split('\n');
      if (lines[0] && lines[0].trim().startsWith('#')) {
        resultTitle = lines[0].replace(/^#+\s*/, '').trim();
        resultContent = lines.slice(1).join('\n').trim();
      } else {
        resultTitle = chapterTitle?.trim() ? `Capítulo ${chapterNumber}: ${chapterTitle.trim()}` : `Capítulo ${chapterNumber}`;
        resultContent = text.trim();
      }
    }

    return { title: resultTitle, content: resultContent, suggestions: resultSuggestions };
  };

  // Handler: Create Story in Active World
  const handleCreateStory = async ({
    title,
    description,
    involvedCharacterIds,
    initialChapterTitle,
    initialInstruction
  }: {
    title: string;
    description: string;
    involvedCharacterIds: string[];
    initialChapterTitle?: string;
    initialInstruction?: string;
  }) => {
    if (!activeWorld) return;

    setIsGenerating(true);
    try {
      const { title: generatedTitle, content, suggestions } = await executeGeneration({
        world: activeWorld,
        storyTitle: title,
        chapterTitle: initialChapterTitle,
        userNote: initialInstruction || 'Comienza la historia presentando a los personajes involucrados y la atmósfera del mundo.',
        chapterNumber: 1,
        involvedCharacterIds,
        previousChapterText: ''
      });

      const firstChapter: Chapter = {
        id: 'chap-' + Date.now(),
        number: 1,
        title: generatedTitle,
        content,
        createdAt: new Date().toISOString(),
        userNoteTrigger: initialInstruction || 'Inicio de la historia',
        wordCount: content.split(/\s+/).length,
        suggestions
      };

      const newStory: StoryItem = {
        id: 'story-' + Date.now(),
        worldId: activeWorld.id,
        title,
        description,
        involvedCharacterIds,
        chapters: [firstChapter],
        currentChapterIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setStories((prev) => [newStory, ...prev]);
      setActiveStoryId(newStory.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Historia "${title}" iniciada.`);
    } catch (err: any) {
      console.error('Error creating story:', err);
      showToast(err?.message || 'Error al iniciar la historia.', 'error');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Generate Next Chapter from Reading View
  const handleGenerateNextChapter = async (userNote: string, customChapterTitle?: string) => {
    if (!activeStory || !activeWorld) return;

    setIsGenerating(true);
    const nextChapterNumber = activeStory.chapters.length + 1;
    const currentChap = currentChapter;
    const previousChapterText = `Capítulo ${currentChap.number}: ${currentChap.title}\n${currentChap.content}`;

    try {
      const { title, content, suggestions } = await executeGeneration({
        world: activeWorld,
        storyTitle: activeStory.title,
        chapterTitle: customChapterTitle,
        userNote,
        chapterNumber: nextChapterNumber,
        involvedCharacterIds: activeStory.involvedCharacterIds,
        previousChapterText
      });

      const newChapter: Chapter = {
        id: 'chap-' + Date.now(),
        number: nextChapterNumber,
        title,
        content,
        createdAt: new Date().toISOString(),
        userNoteTrigger: userNote,
        wordCount: content.split(/\s+/).length,
        suggestions
      };

      setStories((prev) =>
        prev.map((s) => {
          if (s.id !== activeStory.id) return s;
          const updatedChapters = [...s.chapters, newChapter];
          return {
            ...s,
            chapters: updatedChapters,
            currentChapterIndex: updatedChapters.length - 1,
            updatedAt: new Date().toISOString()
          };
        })
      );

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Capítulo ${nextChapterNumber} redactado con éxito.`);
    } catch (err: any) {
      console.error('Error generating chapter:', err);
      showToast(err.message || 'Error al generar el capítulo.', 'error');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Rewrite Current Chapter with Mode, Style Alterations and History Tracking
  const handleRewriteChapter = async ({
    mode,
    additionalNote,
    selectedStyles = [],
    styleNote = ''
  }: {
    mode: 'más larga' | 'más corta' | 'otro';
    additionalNote: string;
    selectedStyles?: StyleOption[];
    styleNote?: string;
  }) => {
    if (!activeStory || !currentChapter || !activeWorld) return;

    setIsRewriting(true);
    try {
      const prevChapterIndex = currentChapterIndex - 1;
      const previousChapterText =
        prevChapterIndex >= 0
          ? `Capítulo ${activeStory.chapters[prevChapterIndex].number}: ${activeStory.chapters[prevChapterIndex].title}\n${activeStory.chapters[prevChapterIndex].content}`
          : '';

      let modeDirective = '';
      if (mode === 'más larga') {
        modeDirective = 'REESCRITURA EXTENSA: Desarrolla mucho más este capítulo. Expande las descripciones sensoriales, la profundidad psicológica, los diálogos inmersivos y la atmósfera del mundo, aumentando significativamente la longitud y riqueza del texto.';
      } else if (mode === 'más corta') {
        modeDirective = 'REESCRITURA CONCISA: Haz este capítulo más ágil, directo y condensado. Ve al grano manteniendo el núcleo emocional y el suspenso sin rodeos innecesarios.';
      } else {
        modeDirective = 'REESCRITURA ALTERNATIVA: Ofrece un giro o enfoque narrativo alternativo y fresco para los sucesos de este capítulo.';
      }

      const styleDirectivesMap: Record<string, string> = {
        'Agregarle más drama': 'AUMENTAR DRAMATISMO: Incrementa la tensión dramática, la gravedad del conflicto, los dilemas morales y el impacto emocional de cada escena.',
        'Menos drama': 'REDUCIR DRAMA: Modera la intensidad dramática o melodramática; mantén un tono más sobrio, sereno, reflexivo y equilibrado.',
        'Más realista': 'MAYOR REALISMO: Da máxima verosimilitud y lógica causal a las reacciones humanas, al entorno físico y a las consecuencias palpables de cada acción.',
        'Más datos médicos': 'DATOS Y PRECISIÓN MÉDICA: Incorpora terminología clínica auténtica, sintomatología, detalles anatómicos, maniobras o procedimientos sanitarios y fisiopatología creíble en las escenas pertinentes.',
        'Más misterio': 'MÁS MISTERIO Y SUSPENSO: Deja enigmas latentes, pistas sutiles entre líneas, sombras y ambigüedad que despierten intriga y desconcierto.',
        'Menos misterio': 'MENOS MISTERIO / MÁS CLARIDAD: Aclara las intenciones y enigmas con revelaciones directas y despeja ambigüedades en la trama.',
        'Otros': 'ESTILO PERSONALIZADO: Aplica las directrices de estilo y tono solicitadas por el lector.'
      };

      const appliedStyleDirectives = selectedStyles
        .map((s) => styleDirectivesMap[s] || s)
        .filter(Boolean);

      const rewriteInstructions = [
        currentChapter.userNoteTrigger ? `Directriz previa del capítulo: "${currentChapter.userNoteTrigger}"` : '',
        `[SOLICITUD DE REESCRITURA - EXTENSIÓN]: ${modeDirective}`,
        appliedStyleDirectives.length > 0
          ? `[MODIFICACIONES DE ESTILO Y TONO SOLICITADAS]:\n${appliedStyleDirectives.map((d) => `- ${d}`).join('\n')}`
          : '',
        styleNote ? `[DETALLES ADICIONALES DE ESTILO Y TONO]: "${styleNote}"` : '',
        additionalNote ? `[INDICACIÓN ADICIONAL DE TRAMA / SUCESOS]: "${additionalNote}"` : '',
        `[BORRADOR PREVIO A TRANSFORMAR O MEJORAR]:\n"""\n${currentChapter.content.slice(0, 1600)}...\n"""\nReescribe por completo el Capítulo ${currentChapter.number} aplicando estas transformaciones de extensión, estilo y trama con excelente prosa literaria.`
      ]
        .filter(Boolean)
        .join('\n\n');

      const { title, content } = await executeGeneration({
        world: activeWorld,
        storyTitle: activeStory.title,
        chapterTitle: currentChapter.title,
        userNote: rewriteInstructions,
        chapterNumber: currentChapter.number,
        involvedCharacterIds: activeStory.involvedCharacterIds,
        previousChapterText
      });

      // 1. Create a snapshot of the current version to preserve in history (max 3 versions)
      const currentSnapshot: ChapterVersion = {
        id: `ver-${Date.now()}`,
        savedAt: new Date().toISOString(),
        title: currentChapter.title,
        content: currentChapter.content,
        wordCount: currentChapter.wordCount || currentChapter.content.split(/\s+/).length,
        label: `Versión previa (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        rewriteNote: [
          mode ? `Extensión: ${mode}` : '',
          selectedStyles.length > 0 ? `Estilos: ${selectedStyles.join(', ')}` : '',
          additionalNote ? `Trama: ${additionalNote}` : '',
          styleNote ? `Tono: ${styleNote}` : ''
        ].filter(Boolean).join(' | ') || currentChapter.userNoteTrigger
      };

      const updatedHistory = [currentSnapshot, ...(currentChapter.history || [])].slice(0, 3);

      setStories((prev) =>
        prev.map((s) => {
          if (s.id !== activeStory.id) return s;
          const updatedChapters = s.chapters.map((chap, idx) => {
            if (idx === currentChapterIndex) {
              return {
                ...chap,
                title: title || chap.title,
                content,
                wordCount: content.split(/\s+/).length,
                userNoteTrigger: rewriteInstructions,
                history: updatedHistory
              };
            }
            return chap;
          });

          return {
            ...s,
            chapters: updatedChapters,
            updatedAt: new Date().toISOString()
          };
        })
      );

      showToast(`Capítulo ${currentChapter.number} reescrito. Se guardó una copia de la versión previa.`);
    } catch (err: any) {
      console.error('Error rewriting chapter:', err);
      showToast(err?.message || 'Error al reescribir el capítulo.', 'error');
    } finally {
      setIsRewriting(false);
    }
  };

  // Handler: Revert Chapter to a previous version from history
  const handleRevertChapter = (versionId: string) => {
    if (!activeStory || !currentChapter) return;
    const targetVersion = currentChapter.history?.find((v) => v.id === versionId);
    if (!targetVersion) return;

    // Snapshot of current chapter before reverting so user can switch back if needed
    const currentSnapshot: ChapterVersion = {
      id: `ver-${Date.now()}`,
      savedAt: new Date().toISOString(),
      title: currentChapter.title,
      content: currentChapter.content,
      wordCount: currentChapter.wordCount || currentChapter.content.split(/\s+/).length,
      label: `Antes de revertir (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      rewriteNote: currentChapter.userNoteTrigger
    };

    const newHistory = [
      currentSnapshot,
      ...(currentChapter.history || []).filter((v) => v.id !== versionId)
    ].slice(0, 3);

    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== activeStory.id) return s;
        const updatedChapters = s.chapters.map((chap, idx) => {
          if (idx === currentChapterIndex) {
            return {
              ...chap,
              title: targetVersion.title,
              content: targetVersion.content,
              wordCount: targetVersion.wordCount,
              history: newHistory
            };
          }
          return chap;
        });

        return {
          ...s,
          chapters: updatedChapters,
          updatedAt: new Date().toISOString()
        };
      })
    );

    showToast(`Capítulo revertido a la versión de las ${new Date(targetVersion.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
  };

  // Chapter Navigation
  const handleSelectChapter = (index: number) => {
    if (!activeStory) return;
    setStories((prev) =>
      prev.map((s) => (s.id === activeStory.id ? { ...s, currentChapterIndex: index } : s))
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevChapter = () => {
    if (!activeStory || activeStory.currentChapterIndex <= 0) return;
    handleSelectChapter(activeStory.currentChapterIndex - 1);
  };

  const handleNextChapter = () => {
    if (!activeStory || activeStory.currentChapterIndex >= activeStory.chapters.length - 1) return;
    handleSelectChapter(activeStory.currentChapterIndex + 1);
  };

  // Theme styling based on reader settings and auto time mode
  const effectiveTheme = getEffectiveReaderTheme(readerSettings);
  const isPaper = effectiveTheme === 'paper';

  const getThemeClass = () => {
    switch (effectiveTheme) {
      case 'paper':
        return 'bg-white text-zinc-950';
      case 'midnight':
        return 'bg-[#0b1120] text-zinc-100';
      case 'espresso':
        return 'bg-[#14100d] text-[#eedcd0]';
      case 'charcoal':
        return 'bg-[#121316] text-zinc-200';
      case 'onyx':
      default:
        return 'bg-[#090a0f] text-zinc-200';
    }
  };

  // Backup data export
  const handleExportAllData = () => {
    const data = { apiKey, selectedModel, worlds, stories, readerSettings };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `lector_novelas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Copia de seguridad descargada.');
  };

  // Reset to initial
  const handleResetAllData = () => {
    if (window.confirm('¿Seguro que deseas reiniciar los mundos e historias iniciales?')) {
      setWorlds(initialWorlds);
      setStories(initialStories);
      setActiveWorldId(null);
      setActiveStoryId(null);
      showToast('Mundos e historias restablecidos.');
    }
  };

  // ---------------- VIEW ROUTING ----------------
  // Case A: Inside Active Story Reader / Continuation
  if (activeStory && activeWorld) {
    const involvedCharacters = activeWorld.characters.filter((c) =>
      activeStory.involvedCharacterIds.includes(c.id)
    );

    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${getThemeClass()}`}>
        {/* Dynamic Reading Progress Bar */}
        <div 
          className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 z-50 transition-all duration-100"
          style={{ width: `${readingProgress}%` }}
        />

        {/* Top Story Header */}
        <Header
          story={activeStory}
          world={activeWorld}
          currentChapterIndex={currentChapterIndex}
          totalChapters={activeStory.chapters.length}
          onBackToWorld={() => setActiveStoryId(null)}
          onOpenCharacters={() => setIsUniverseModalOpen(true)}
          onOpenSettings={() => setIsConfigModalOpen(true)}
          onOpenReaderSettings={() => setIsReaderSettingsOpen(true)}
          onOpenExportIndex={() => setIsExportIndexOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          isSaving={isSaving}
          isPaper={isPaper}
        />

        {/* Main E-Reader Content */}
        <main className="flex-1 w-full">
          <ReaderView
            chapter={currentChapter}
            chapters={activeStory.chapters}
            currentIndex={currentChapterIndex}
            readerSettings={readerSettings}
            characters={activeWorld.characters}
            onSelectChapter={handleSelectChapter}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            onRewriteChapter={handleRewriteChapter}
            onRevertChapter={handleRevertChapter}
            isRewriting={isRewriting}
          />

          {/* Continuation Box for Next Chapter */}
          <CommentBox
            currentChapterNumber={currentChapter.number}
            currentChapter={currentChapter}
            characters={involvedCharacters}
            world={activeWorld}
            story={activeStory}
            apiKey={apiKey}
            hasServerKey={hasServerKey}
            selectedModel={selectedModel}
            hasApiKey={Boolean(apiKey.trim() || hasServerKey)}
            isGenerating={isGenerating}
            onGenerateNextChapter={handleGenerateNextChapter}
            onOpenSettings={() => setIsConfigModalOpen(true)}
            isPaper={isPaper}
          />
        </main>

        {/* Modal: Characters & World Rules during Reading */}
        <UniverseModal
          isOpen={isUniverseModalOpen}
          world={activeWorld}
          characters={involvedCharacters}
          onClose={() => setIsUniverseModalOpen(false)}
        />

        {/* Modal: Config & Key */}
        <ConfigModal
          isOpen={isConfigModalOpen}
          apiKey={apiKey}
          selectedModel={selectedModel}
          onClose={() => setIsConfigModalOpen(false)}
          onSaveConfig={(newKey, newModel) => {
            setApiKey(newKey);
            setSelectedModel(newModel);
            showToast('Configuración guardada.');
          }}
          onExportAllData={handleExportAllData}
          onResetAllData={handleResetAllData}
        />

        {/* Modal: Reader Settings (Aa) */}
        <ReaderSettingsModal
          isOpen={isReaderSettingsOpen}
          settings={readerSettings}
          onClose={() => setIsReaderSettingsOpen(false)}
          onUpdateSettings={(s) => setReaderSettings(s)}
        />

        {/* Modal: Export Index & Stories */}
        <ExportIndexModal
          isOpen={isExportIndexOpen}
          onClose={() => setIsExportIndexOpen(false)}
          stories={stories}
          worlds={worlds}
          showToast={showToast}
        />

        {/* Modal: Global Worlds/Stories Search */}
        <WorldSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          worlds={worlds}
          stories={stories}
          onNavigateToWorld={handleNavigateToWorld}
          onNavigateToStory={handleNavigateToStory}
          onNavigateToChapter={handleNavigateToChapter}
        />

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-zinc-900/95 px-4 py-2.5 text-xs font-medium text-zinc-100 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // Case B: Inside a Selected World (List Stories or Create Story)
  if (activeWorld) {
    const worldStories = stories.filter((s) => s.worldId === activeWorld.id);

    return (
      <>
        <WorldDetailView
          world={activeWorld}
          stories={worldStories}
          onBackToHome={() => setActiveWorldId(null)}
          onSelectStory={(story) => {
            setActiveStoryId(story.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCreateStory={handleCreateStory}
          onEditWorld={(world) => {
            setWorldToEdit(world);
            setIsWorldEditorOpen(true);
          }}
          onDeleteStory={handleDeleteStory}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          isGeneratingStory={isGenerating}
        />

        {/* World Editor Modal */}
        <WorldEditorModal
          isOpen={isWorldEditorOpen}
          initialWorld={worldToEdit}
          onClose={() => {
            setIsWorldEditorOpen(false);
            setWorldToEdit(null);
          }}
          onSaveWorld={handleSaveWorld}
          apiKey={apiKey}
          selectedModel={selectedModel}
          hasServerKey={hasServerKey}
        />

        {/* Modal: Global Worlds/Stories Search */}
        <WorldSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          worlds={worlds}
          stories={stories}
          onNavigateToWorld={handleNavigateToWorld}
          onNavigateToStory={handleNavigateToStory}
          onNavigateToChapter={handleNavigateToChapter}
        />

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-zinc-900/95 px-4 py-2.5 text-xs font-medium text-zinc-100 shadow-2xl backdrop-blur-md">
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  // Case C: Home View ("Lectura", Key, Selecciona un mundo, Crear nuevo mundo)
  return (
    <>
      <HomeView
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onSaveApiKey={handleSaveApiKey}
        worlds={worlds}
        storiesCountByWorld={storiesCountByWorld}
        onSelectWorld={(world) => setActiveWorldId(world.id)}
        onCreateNewWorld={() => {
          setWorldToEdit(null);
          setIsWorldEditorOpen(true);
        }}
        onEditWorld={(world) => {
          setWorldToEdit(world);
          setIsWorldEditorOpen(true);
        }}
        onDeleteWorld={handleDeleteWorld}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* World Creator/Editor Modal */}
      <WorldEditorModal
        isOpen={isWorldEditorOpen}
        initialWorld={worldToEdit}
        onClose={() => {
          setIsWorldEditorOpen(false);
          setWorldToEdit(null);
        }}
        onSaveWorld={handleSaveWorld}
        apiKey={apiKey}
        selectedModel={selectedModel}
        hasServerKey={hasServerKey}
      />

      {/* Modal: Global Worlds/Stories Search */}
      <WorldSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        worlds={worlds}
        stories={stories}
        onNavigateToWorld={handleNavigateToWorld}
        onNavigateToStory={handleNavigateToStory}
        onNavigateToChapter={handleNavigateToChapter}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-zinc-900/95 px-4 py-2.5 text-xs font-medium text-zinc-100 shadow-2xl backdrop-blur-md">
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
