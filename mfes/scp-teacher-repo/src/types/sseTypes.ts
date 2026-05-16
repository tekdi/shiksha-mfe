/**
 * SSE Event Protocol Types for the AI Content Pipeline.
 *
 * These types define the contract between the SSE server endpoint and
 * client consumers. They are intentionally decoupled from any framework
 * so they can be shared across the Next.js API route, React hooks,
 * and future Express.js orchestration layer.
 */

// ---------------------------------------------------------------------------
// Pipeline Stage & Status Enums
// ---------------------------------------------------------------------------

/** Ordered stages of the AI content processing pipeline. */
export enum PipelineStage {
  UPLOAD = 'UPLOAD',
  TRANSCRIBE = 'TRANSCRIBE',
  SUMMARISE = 'SUMMARISE',
  GENERATE_QUESTIONS = 'GENERATE_QUESTIONS',
  PACKAGE_H5P = 'PACKAGE_H5P',
}

/** Lifecycle status of an individual pipeline stage. */
export enum StageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ---------------------------------------------------------------------------
// SSE Event Names
// ---------------------------------------------------------------------------

/**
 * Discriminated event type names sent over the SSE stream.
 * Used as the `event:` field in the SSE protocol.
 */
export const SSE_EVENTS = {
  STAGE: 'pipeline:stage',
  PROGRESS: 'pipeline:progress',
  COMPLETE: 'pipeline:complete',
  ERROR: 'pipeline:error',
} as const;

export type SSEEventName = (typeof SSE_EVENTS)[keyof typeof SSE_EVENTS];

// ---------------------------------------------------------------------------
// SSE Event Payloads (Discriminated Union)
// ---------------------------------------------------------------------------

/** Emitted when a pipeline stage transitions status. */
export interface PipelineStageEvent {
  type: typeof SSE_EVENTS.STAGE;
  jobId: string;
  stage: PipelineStage;
  status: StageStatus;
  message: string;
}

/** Emitted periodically to report progress within a stage. */
export interface PipelineProgressEvent {
  type: typeof SSE_EVENTS.PROGRESS;
  jobId: string;
  stage: PipelineStage;
  percent: number;
  detail: string;
}

/** Emitted once when the entire pipeline completes successfully. */
export interface PipelineCompleteEvent {
  type: typeof SSE_EVENTS.COMPLETE;
  jobId: string;
  artifactUrl: string;
  totalDurationMs: number;
}

/** Emitted when a pipeline stage encounters an unrecoverable error. */
export interface PipelineErrorEvent {
  type: typeof SSE_EVENTS.ERROR;
  jobId: string;
  stage: PipelineStage;
  code: string;
  message: string;
}

/** Union of all possible SSE event payloads. */
export type PipelineEvent =
  | PipelineStageEvent
  | PipelineProgressEvent
  | PipelineCompleteEvent
  | PipelineErrorEvent;

// ---------------------------------------------------------------------------
// SSE Wire Format
// ---------------------------------------------------------------------------

/**
 * The shape of a single SSE frame as written to the stream.
 * `id` enables the browser's `Last-Event-ID` reconnection header.
 * `event` maps to the SSE `event:` field for named event listeners.
 * `data` is the JSON-serialised payload.
 */
export interface SSEFrame {
  id: string;
  event: SSEEventName;
  data: string; // JSON.stringify(PipelineEvent)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Client-side reconnect interval hint (ms), sent via SSE `retry:` field. */
export const SSE_RETRY_MS = 3_000;

/** Server-side heartbeat interval (ms) to keep connections alive through proxies. */
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Human-readable labels for each pipeline stage.
 * Used by the UI — kept co-located with the enum for single source of truth.
 */
export const STAGE_LABELS: Record<PipelineStage, { label: string; description: string }> = {
  [PipelineStage.UPLOAD]: {
    label: 'Upload',
    description: 'Ingesting and validating the source asset',
  },
  [PipelineStage.TRANSCRIBE]: {
    label: 'Transcribe',
    description: 'Converting audio/video to text via Whisper ASR',
  },
  [PipelineStage.SUMMARISE]: {
    label: 'Summarise',
    description: 'Extracting key takeaways and glossary via Mistral',
  },
  [PipelineStage.GENERATE_QUESTIONS]: {
    label: 'Generate Questions',
    description: 'Creating MCQs with RAG-powered distractors',
  },
  [PipelineStage.PACKAGE_H5P]: {
    label: 'Package H5P',
    description: 'Compiling validated JSON into H5P/SCORM packages',
  },
};

/** Ordered array of stages for iteration (matches pipeline execution order). */
export const PIPELINE_STAGES_ORDERED: PipelineStage[] = [
  PipelineStage.UPLOAD,
  PipelineStage.TRANSCRIBE,
  PipelineStage.SUMMARISE,
  PipelineStage.GENERATE_QUESTIONS,
  PipelineStage.PACKAGE_H5P,
];

/**
 * Weight of each stage towards overall progress (must sum to 1.0).
 * Reflects approximate real-world compute time distribution.
 */
export const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  [PipelineStage.UPLOAD]: 0.05,
  [PipelineStage.TRANSCRIBE]: 0.30,
  [PipelineStage.SUMMARISE]: 0.25,
  [PipelineStage.GENERATE_QUESTIONS]: 0.25,
  [PipelineStage.PACKAGE_H5P]: 0.15,
};
