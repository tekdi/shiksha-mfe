import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PipelineProgress from '../PipelineProgress';
import useAIStudioStore from '../../../store/aiStudioStore';
import { PipelineStage, StageStatus } from '../../../types/sseTypes';

// Mock the store
jest.mock('../../../store/aiStudioStore');
jest.mock('../../../hooks/useSSE', () => ({
  useSSE: jest.fn(() => ({ readyState: 1, error: null, close: jest.fn() }))
}));

const mockStore = useAIStudioStore as jest.MockedFunction<typeof useAIStudioStore>;

describe('PipelineProgress Component', () => {
  const initialStages = {
    [PipelineStage.UPLOAD]: { status: StageStatus.PENDING, progress: 0, message: '' },
    [PipelineStage.TRANSCRIBE]: { status: StageStatus.PENDING, progress: 0, message: '' },
    [PipelineStage.SUMMARISE]: { status: StageStatus.PENDING, progress: 0, message: '' },
    [PipelineStage.GENERATE_QUESTIONS]: { status: StageStatus.PENDING, progress: 0, message: '' },
    [PipelineStage.PACKAGE_H5P]: { status: StageStatus.PENDING, progress: 0, message: '' },
  };

  beforeEach(() => {
    mockStore.mockReturnValue({
      pipelineJobId: 'test-job-id',
      pipelineStatus: 'running',
      pipelineStages: initialStages,
      pipelineError: null,
      pipelineStartedAt: Date.now(),
      handleStageEvent: jest.fn(),
      handleProgressEvent: jest.fn(),
      handleCompleteEvent: jest.fn(),
      handleErrorEvent: jest.fn(),
      setStep: jest.fn(),
      resetPipeline: jest.fn(),
    } as any);
  });

  it('renders all 5 stage cards in PENDING state initially', () => {
    render(<PipelineProgress />);
    
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Transcribe')).toBeInTheDocument();
    expect(screen.getByText('Summarise')).toBeInTheDocument();
    expect(screen.getByText('Generate Questions')).toBeInTheDocument();
    expect(screen.getByText('Package H5P')).toBeInTheDocument();
  });

  it('shows progress for an IN_PROGRESS stage', () => {
    mockStore.mockReturnValue({
      pipelineJobId: 'test-job-id',
      pipelineStatus: 'running',
      pipelineStages: {
        ...initialStages,
        [PipelineStage.TRANSCRIBE]: { status: StageStatus.IN_PROGRESS, progress: 45, message: 'Processing audio...' },
      },
      pipelineError: null,
      pipelineStartedAt: Date.now(),
      handleStageEvent: jest.fn(),
      handleProgressEvent: jest.fn(),
      handleCompleteEvent: jest.fn(),
      handleErrorEvent: jest.fn(),
      setStep: jest.fn(),
      resetPipeline: jest.fn(),
    } as any);

    render(<PipelineProgress />);
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Processing audio...')).toBeInTheDocument();
  });

  it('shows error banner when pipelineError exists', () => {
    mockStore.mockReturnValue({
      pipelineJobId: 'test-job-id',
      pipelineStatus: 'failed',
      pipelineStages: initialStages,
      pipelineError: { stage: PipelineStage.SUMMARISE, code: '500', message: 'Mistral timeout' },
      pipelineStartedAt: Date.now(),
      handleStageEvent: jest.fn(),
      handleProgressEvent: jest.fn(),
      handleCompleteEvent: jest.fn(),
      handleErrorEvent: jest.fn(),
      setStep: jest.fn(),
      resetPipeline: jest.fn(),
    } as any);

    render(<PipelineProgress />);
    expect(screen.getByText(/Mistral timeout/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
