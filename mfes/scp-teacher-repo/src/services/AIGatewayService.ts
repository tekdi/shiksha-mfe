const GATEWAY_URL = process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:8000';

export interface LlmAnalysis {
  takeaways: any[];
  glossary: any[];
  narration_script?: string;
}

export interface IngestionResponse {
  file_id: string;
  filename: string;
  llm_analysis: LlmAnalysis;
  document_type: string;
}

export interface AssessmentResponse {
  type: 'quiz';
  questionType: string;
  sourceFile: string;
  generatedAt: string;
  questions: any[];
}

export const AIGatewayService = {
  async uploadDocument(file: File): Promise<IngestionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${GATEWAY_URL}/api/v1/ingestion/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  async generateAssessment(params: {
    source_text: string;
    question_types: string[];
    question_count: number;
    difficulty: string;
    title: string;
  }): Promise<AssessmentResponse> {
    const res = await fetch(`${GATEWAY_URL}/api/v1/assessment/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Assessment generation failed: ${res.status}`);
    return res.json();
  },

  getPipelineStreamUrl(jobId: string): string {
    return `${GATEWAY_URL}/api/v1/pipeline/stream?job_id=${jobId}`;
  },
  
  async transcribeMedia(file: File, language: string = 'auto') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
      `${GATEWAY_URL}/api/v1/multimedia/transcribe?language=${language}`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
    return res.json();
  },

  async generateMicroLesson(params: {
    title: string;
    source_text: string;
    branding: any;
  }): Promise<any> {
    const res = await fetch(`${GATEWAY_URL}/api/v1/lessons/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Micro-lesson generation failed: ${res.status}`);
    return res.json();
  },
};
