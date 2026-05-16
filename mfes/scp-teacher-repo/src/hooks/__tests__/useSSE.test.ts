/**
 * Unit tests for the useSSE hook.
 *
 * Mocks the browser EventSource API to verify:
 *   - Connection lifecycle (connect, disconnect, cleanup)
 *   - Named event dispatching
 *   - Auto-reconnect with exponential backoff
 *   - Unmount cleanup (no leaked EventSource)
 */

import { renderHook, act } from '@testing-library/react';
import { useSSE, SSEReadyState } from '../useSSE';

// ---------------------------------------------------------------------------
// EventSource Mock
// ---------------------------------------------------------------------------

type MockEventSourceInstance = {
  url: string;
  onopen: ((evt: Event) => void) | null;
  onerror: ((evt: Event) => void) | null;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  close: jest.Mock;
  readyState: number;
  _listeners: Record<string, Array<(evt: MessageEvent) => void>>;
  _simulateOpen: () => void;
  _simulateError: () => void;
  _simulateEvent: (name: string, data: any) => void;
};

let mockInstances: MockEventSourceInstance[] = [];

class MockEventSource {
  url: string;
  onopen: ((evt: Event) => void) | null = null;
  onerror: ((evt: Event) => void) | null = null;
  readyState = 0;
  _listeners: Record<string, Array<(evt: MessageEvent) => void>> = {};

  addEventListener = jest.fn((name: string, handler: (evt: MessageEvent) => void) => {
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(handler);
  });

  removeEventListener = jest.fn();
  close = jest.fn(() => {
    this.readyState = 2;
  });

  constructor(url: string) {
    this.url = url;
    mockInstances.push(this as unknown as MockEventSourceInstance);
  }

  _simulateOpen() {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  _simulateError() {
    this.readyState = 2;
    this.onerror?.(new Event('error'));
  }

  _simulateEvent(name: string, data: any) {
    const handlers = this._listeners[name] || [];
    const evt = { data: JSON.stringify(data) } as MessageEvent;
    handlers.forEach((h) => h(evt));
  }
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockInstances = [];
  (global as any).EventSource = MockEventSource;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  delete (global as any).EventSource;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSSE', () => {
  it('should not connect when url is null', () => {
    renderHook(() => useSSE(null));
    expect(mockInstances).toHaveLength(0);
  });

  it('should connect when url is provided', () => {
    const { result } = renderHook(() => useSSE('/api/test'));

    expect(mockInstances).toHaveLength(1);
    expect(mockInstances[0].url).toBe('/api/test');
    expect(result.current.readyState).toBe(SSEReadyState.CONNECTING);
  });

  it('should transition to OPEN on successful connection', () => {
    const { result } = renderHook(() => useSSE('/api/test'));

    act(() => {
      mockInstances[0]._simulateOpen();
    });

    expect(result.current.readyState).toBe(SSEReadyState.OPEN);
  });

  it('should dispatch named events to the correct handler', () => {
    const handler = jest.fn();

    renderHook(() =>
      useSSE('/api/test', {
        eventHandlers: { 'pipeline:stage': handler },
      }),
    );

    act(() => {
      mockInstances[0]._simulateOpen();
    });

    act(() => {
      mockInstances[0]._simulateEvent('pipeline:stage', { stage: 'UPLOAD', status: 'IN_PROGRESS' });
    });

    expect(handler).toHaveBeenCalledWith({ stage: 'UPLOAD', status: 'IN_PROGRESS' });
  });

  it('should auto-reconnect on error with exponential backoff', () => {
    renderHook(() =>
      useSSE('/api/test', {
        maxRetries: 2,
        retryBaseDelayMs: 1000,
      }),
    );

    expect(mockInstances).toHaveLength(1);

    // First error → schedule retry after 1s
    act(() => {
      mockInstances[0]._simulateError();
    });

    expect(mockInstances[0].close).toHaveBeenCalled();

    // Advance 1s → should reconnect (attempt 1)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockInstances).toHaveLength(2);

    // Second error → schedule retry after 2s (exponential)
    act(() => {
      mockInstances[1]._simulateError();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockInstances).toHaveLength(3);

    // Third error → no more retries (maxRetries = 2)
    act(() => {
      mockInstances[2]._simulateError();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockInstances).toHaveLength(3); // No more instances created
  });

  it('should close connection and prevent reconnect on manual close()', () => {
    const { result } = renderHook(() =>
      useSSE('/api/test', { maxRetries: 3 }),
    );

    act(() => {
      mockInstances[0]._simulateOpen();
    });

    act(() => {
      result.current.close();
    });

    expect(mockInstances[0].close).toHaveBeenCalled();
    expect(result.current.readyState).toBe(SSEReadyState.CLOSED);

    // Simulate error after manual close — should NOT reconnect
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockInstances).toHaveLength(1);
  });

  it('should clean up EventSource on unmount', () => {
    const { unmount } = renderHook(() => useSSE('/api/test'));

    act(() => {
      mockInstances[0]._simulateOpen();
    });

    unmount();

    expect(mockInstances[0].close).toHaveBeenCalled();
  });

  it('should disconnect when url changes to null', () => {
    const { rerender } = renderHook(
      ({ url }: { url: string | null }) => useSSE(url),
      { initialProps: { url: '/api/test' as string | null } },
    );

    act(() => {
      mockInstances[0]._simulateOpen();
    });

    rerender({ url: null });

    expect(mockInstances[0].close).toHaveBeenCalled();
  });

  it('should set error state on connection error', () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useSSE('/api/test', { maxRetries: 0, onError }),
    );

    act(() => {
      mockInstances[0]._simulateError();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.readyState).toBe(SSEReadyState.CLOSED);
    expect(onError).toHaveBeenCalled();
  });
});
