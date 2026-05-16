/**
 * useSSE — Generic, typed React hook for consuming Server-Sent Events.
 *
 * Features:
 *   - Lazy connection: only connects when `url` is non-null.
 *   - Typed named event listeners via `eventHandlers` map.
 *   - Auto-reconnect with exponential backoff.
 *   - Heartbeat staleness detection.
 *   - Full cleanup on unmount — no leaked EventSource or timers.
 *
 * @example
 * ```tsx
 * const { readyState, error, close } = useSSE<PipelineEvent>(
 *   isRunning ? '/api/content-pipeline' : null,
 *   {
 *     eventHandlers: {
 *       'pipeline:stage': (data) => store.handleStageEvent(data),
 *       'pipeline:progress': (data) => store.handleProgressEvent(data),
 *       'pipeline:complete': (data) => store.handleCompleteEvent(data),
 *       'pipeline:error': (data) => store.handleErrorEvent(data),
 *     },
 *   },
 * );
 * ```
 *
 * @module hooks/useSSE
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum SSEReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSED = 2,
}

export interface UseSSEOptions {
  /**
   * Map of SSE event names to handler functions.
   * The handler receives the parsed JSON `data` field.
   * If a `message` handler is provided, it will receive unnamed events.
   */
  eventHandlers?: Record<string, (data: any) => void>;

  /** Maximum number of auto-reconnect attempts. Default: 3. */
  maxRetries?: number;

  /** Base delay (ms) for exponential backoff. Default: 1000. */
  retryBaseDelayMs?: number;

  /**
   * If no data is received within this duration (ms), the connection
   * is considered stale and will be reconnected. Default: 45000.
   * Set to 0 to disable heartbeat detection.
   */
  heartbeatTimeoutMs?: number;

  /** Called when the connection opens. */
  onOpen?: () => void;

  /** Called when a connection error occurs (before auto-reconnect). */
  onError?: (error: Event) => void;
}

export interface UseSSEReturn {
  /** Current connection state. */
  readyState: SSEReadyState;

  /** Last error event, if any. */
  error: Event | null;

  /** Manually close the connection (disables auto-reconnect). */
  close: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSSE(
  url: string | null,
  options: UseSSEOptions = {},
): UseSSEReturn {
  const {
    eventHandlers = {},
    maxRetries = 3,
    retryBaseDelayMs = 1_000,
    heartbeatTimeoutMs = 45_000,
    onOpen,
    onError,
  } = options;

  const [readyState, setReadyState] = useState<SSEReadyState>(SSEReadyState.CLOSED);
  const [error, setError] = useState<Event | null>(null);

  // Refs to survive re-renders without triggering reconnects
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedManuallyRef = useRef(false);

  // Stable reference to latest handlers (avoids reconnect on handler change)
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  /** Clear all pending timers. */
  const clearTimers = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (heartbeatTimerRef.current !== null) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  /** Close the current EventSource and clean up. */
  const disconnect = useCallback(() => {
    clearTimers();
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setReadyState(SSEReadyState.CLOSED);
  }, [clearTimers]);

  /** Public close — also prevents auto-reconnect. */
  const close = useCallback(() => {
    closedManuallyRef.current = true;
    disconnect();
  }, [disconnect]);

  /** Reset the heartbeat staleness timer. */
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutMs <= 0) return;

    if (heartbeatTimerRef.current !== null) {
      clearTimeout(heartbeatTimerRef.current);
    }

    heartbeatTimerRef.current = setTimeout(() => {
      // Connection is stale — force reconnect
      if (esRef.current) {
        esRef.current.close();
        // The onerror handler will trigger reconnect
      }
    }, heartbeatTimeoutMs);
  }, [heartbeatTimeoutMs]);

  useEffect(() => {
    // If no URL, disconnect and reset
    if (!url) {
      disconnect();
      closedManuallyRef.current = false;
      retriesRef.current = 0;
      return;
    }

    // Don't reconnect if manually closed
    if (closedManuallyRef.current) return;

    const registerHandlers = (es: EventSource) => {
      const currentHandlers = handlersRef.current;
      for (const eventName of Object.keys(currentHandlers)) {
        es.addEventListener(eventName, ((evt: MessageEvent) => {
          resetHeartbeat();
          try {
            const parsed = JSON.parse(evt.data);
            handlersRef.current[eventName]?.(parsed);
          } catch {
            // If data isn't JSON, pass the raw string
            handlersRef.current[eventName]?.(evt.data);
          }
        }) as EventListener);
      }
    };

    const connect = () => {
      // Clean up any previous connection
      if (esRef.current) {
        esRef.current.close();
      }
      clearTimers();

      setReadyState(SSEReadyState.CONNECTING);
      setError(null);

      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setReadyState(SSEReadyState.OPEN);
        retriesRef.current = 0; // Reset retry counter on successful connection
        resetHeartbeat();
        onOpenRef.current?.();
      };

      es.onerror = (evt) => {
        handleConnectionError(evt);
      };

      registerHandlers(es);
    };

    const handleConnectionError = (evt: Event) => {
      setError(evt);
      setReadyState(SSEReadyState.CLOSED);
      onErrorRef.current?.(evt);

      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      // Auto-reconnect with exponential backoff
      if (!closedManuallyRef.current && retriesRef.current < maxRetries) {
        const delay = retryBaseDelayMs * Math.pow(2, retriesRef.current);
        retriesRef.current += 1;

        retryTimerRef.current = setTimeout(() => {
          if (!closedManuallyRef.current) {
            connect();
          }
        }, delay);
      }
    };

    closedManuallyRef.current = false;
    retriesRef.current = 0;
    connect();

    // Cleanup on unmount or URL change
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  // Intentionally only depending on `url` — handler changes are picked up via ref.

  return { readyState, error, close };
}
