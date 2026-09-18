import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceDictationButtonProps {
  /**
   * Current text value of the input or textarea.
   */
  value: string;
  /**
   * Callback to update the text value when voice is transcribed.
   */
  onChange: (newValue: string) => void;
  /**
   * Optional custom label or placeholder identifier.
   */
  title?: string;
  /**
   * Visual theme mode (light paper vs dark).
   */
  isPaper?: boolean;
  /**
   * Size variation: 'sm' for inline titles or 'md' for section headers / textareas.
   */
  size?: 'xs' | 'sm' | 'md';
  /**
   * Optional additional container classes.
   */
  className?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  value,
  onChange,
  title = 'Dictar por voz',
  isPaper = false,
  size = 'sm',
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyActiveRef = useRef(false);
  const baseValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track finalized result indices to guarantee no result index is processed more than once
  const processedIndicesRef = useRef<Set<number>>(new Set());
  const lastFinalizedTextRef = useRef<string>('');
  const lastFinalizedTimeRef = useRef<number>(0);

  // Keep track of latest base value when not actively dictating
  useEffect(() => {
    if (!isListening) {
      baseValueRef.current = value;
    }
  }, [value, isListening]);

  // Clean up recognition instance on unmount
  useEffect(() => {
    return () => {
      isManuallyActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleStop = useCallback(() => {
    isManuallyActiveRef.current = false;
    setIsListening(false);
    processedIndicesRef.current.clear();
    lastFinalizedTextRef.current = '';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const handleStart = useCallback(() => {
    setErrorMessage(null);
    baseValueRef.current = value;
    processedIndicesRef.current.clear();
    lastFinalizedTextRef.current = '';
    lastFinalizedTimeRef.current = 0;

    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Tu navegador no soporta la función de voz a texto nativa.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      // Do not use interim results to avoid hypothesis repetition
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      // Use Spanish as preferred language for dictation
      recognition.lang = 'es-ES';

      isManuallyActiveRef.current = true;
      setIsListening(true);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let newlyFinalizedChunk = '';

        // Iterate through all results and process only new final items
        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result.isFinal) {
            if (!processedIndicesRef.current.has(i)) {
              processedIndicesRef.current.add(i);
              const transcript = result[0]?.transcript?.trim();
              if (transcript) {
                newlyFinalizedChunk += (newlyFinalizedChunk ? ' ' : '') + transcript;
              }
            }
          }
        }

        if (newlyFinalizedChunk) {
          // Extra guard: avoid immediate duplicate replay from browser speech restart
          const now = Date.now();
          if (
            newlyFinalizedChunk.toLowerCase() === lastFinalizedTextRef.current.toLowerCase() &&
            now - lastFinalizedTimeRef.current < 1500
          ) {
            return;
          }
          lastFinalizedTextRef.current = newlyFinalizedChunk;
          lastFinalizedTimeRef.current = now;

          const currentBase = baseValueRef.current;
          const needsSpace = currentBase.length > 0 && !/[\s\n]$/.test(currentBase);
          const updated = currentBase + (needsSpace ? ' ' : '') + newlyFinalizedChunk;
          baseValueRef.current = updated;
          onChangeRef.current(updated);
        }
      };

      recognition.onerror = (event: any) => {
        // 'no-speech' is common and not a fatal error; ignore unless it persists
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isManuallyActiveRef.current = false;
          setIsListening(false);
          setErrorMessage('Permiso de micrófono denegado. Habilita el micrófono para dictar.');
          setTimeout(() => setErrorMessage(null), 4000);
        } else if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        // Keep listening until the user clicks manually to stop
        if (isManuallyActiveRef.current) {
          processedIndicesRef.current.clear();
          try {
            recognition.start();
          } catch {
            // Already started or restarting
          }
        } else {
          setIsListening(false);
          processedIndicesRef.current.clear();
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      isManuallyActiveRef.current = false;
      setErrorMessage('No se pudo acceder al micrófono.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  }, [value]);

  const toggleListening = () => {
    if (isListening) {
      handleStop();
    } else {
      handleStart();
    }
  };

  // Size specific styling
  const sizeClasses = {
    xs: isListening ? 'h-6 px-2 text-[11px] gap-1' : 'h-6 w-6 text-xs p-0',
    sm: isListening ? 'h-7 px-2.5 text-xs gap-1.5' : 'h-7 w-7 text-xs p-0',
    md: isListening ? 'h-8 px-3 text-xs gap-1.5' : 'h-8 w-8 text-sm p-0'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        title={
          isListening
            ? '🎙️ Escuchando... Haz clic para parar la grabación'
            : `${title} (Disfrazado con ❤️ - pulsa para abrir el micrófono)`
        }
        aria-label={
          isListening
            ? 'Detener dictado por voz'
            : 'Iniciar dictado por voz disfrazado con corazón'
        }
        className={`inline-flex items-center justify-center font-medium rounded-full transition-all select-none shadow-xs active:scale-95 ${
          sizeClasses[size]
        } ${
          isListening
            ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-1 ring-offset-zinc-950 animate-pulse shadow-md'
            : isPaper
              ? 'bg-rose-50/80 hover:bg-rose-100 text-rose-600 border border-rose-200/80 hover:border-rose-300'
              : 'bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:border-rose-400/50'
        }`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <Mic className="relative h-3.5 w-3.5 text-white" />
            </span>
            <span className="font-semibold tracking-wide text-[11px]">
              Escuchando...
            </span>
          </>
        ) : (
          <span className="text-sm leading-none transition-transform duration-200 hover:scale-125 select-none">
            ❤️
          </span>
        )}
      </button>

      {/* When listening, show a small visual pulse wave and manual stop indicator */}
      {isListening && (
        <span
          onClick={handleStop}
          className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
            isPaper
              ? 'bg-rose-100 text-rose-900 border border-rose-300'
              : 'bg-rose-950/80 text-rose-200 border border-rose-800'
          }`}
          title="Haz clic para detener"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>Detener</span>
        </span>
      )}

      {/* Temporary error toast tooltip */}
      {errorMessage && (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/90 border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-200 shadow-md">
          <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </span>
      )}
    </div>
  );
};
