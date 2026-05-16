import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AssetUploadStep from '../AssetUploadStep';
import useAIStudioStore from '../../../store/aiStudioStore';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

// Mock the store
jest.mock('../../../store/aiStudioStore');
const mockStore = useAIStudioStore as jest.MockedFunction<typeof useAIStudioStore>;

describe('AssetUploadStep Component', () => {
  const mockSetLanguage = jest.fn();
  const mockSetSelectedFile = jest.fn();
  const mockToggleOutputType = jest.fn();

  const setupMockStore = (overrides = {}) => {
    mockStore.mockReturnValue({
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      selectedOutputTypes: [],
      toggleOutputType: mockToggleOutputType,
      setStep: jest.fn(),
      selectedLanguage: 'auto',
      setLanguage: mockSetLanguage,
      ...overrides
    } as any);
  };

  beforeEach(() => {
    setupMockStore();
  });

  const renderComponent = () => render(
    <ThemeProvider theme={theme}>
      <AssetUploadStep />
    </ThemeProvider>
  );

  it('renders language selector with 3 options when a video is selected', () => {
    setupMockStore({ selectedFile: new File([''], 'video.mp4', { type: 'video/mp4' }) });
    renderComponent();
    
    expect(screen.getByText('Transcription Language')).toBeInTheDocument();
    expect(screen.getByText('Auto-detect')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Hindi (Hinglish output)')).toBeInTheDocument();
  });

  it('does not render language selector when no file is selected', () => {
    renderComponent();
    expect(screen.queryByText('Transcription Language')).not.toBeInTheDocument();
  });

  it('shows Hindi info chip when Hindi is selected', () => {
    setupMockStore({ 
      selectedFile: new File([''], 'video.mp4', { type: 'video/mp4' }),
      selectedLanguage: 'hi' 
    });
    renderComponent();
    expect(screen.getByText('Powered by Whisper-Hindi2Hinglish-Swift')).toBeInTheDocument();
  });

  it('calls setLanguage when a language is selected', () => {
    setupMockStore({ selectedFile: new File([''], 'video.mp4', { type: 'video/mp4' }) });
    renderComponent();
    
    const hindiButton = screen.getByText('Hindi (Hinglish output)');
    fireEvent.click(hindiButton);
    
    expect(mockSetLanguage).toHaveBeenCalledWith('hi');
  });
});
