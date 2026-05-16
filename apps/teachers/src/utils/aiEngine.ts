/**
 * AI Engine API helper
 *
 * Single source of truth for the AI Engine base URL.
 * Set NEXT_PUBLIC_AI_ENGINE_URL in your .env.local (or deployment env) to
 * point at the real service. The localhost fallback is intentional for
 * local development only and must never be used in production.
 */

export const AI_ENGINE_BASE_URL =
  process.env.NEXT_PUBLIC_AI_ENGINE_URL ??
  (process.env.NODE_ENV === 'production'
    ? '' // fail loudly in prod if the env var is missing
    : 'http://localhost:8000');

/**
 * Check backend liveness.
 * Returns true if the service responds with { status: "healthy" }.
 */
export async function checkAiEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'healthy';
  } catch {
    return false;
  }
}

export interface IngestResponse {
  headers: string[];
  body_text: string;
  images: Array<{ page: number; index: number; ext: string; data: string }>;
  metadata: Record<string, string>;
  key_takeaways: string[];
  glossary: Record<string, string>;
  narration_script: string;
}

/**
 * Upload a PDF file to the /ingest endpoint.
 * Throws on network error or non-2xx response.
 */
export async function ingestPdf(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${AI_ENGINE_BASE_URL}/ingest`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.detail ?? `Upload failed with status ${res.status}`
    );
  }

  return res.json() as Promise<IngestResponse>;
}
