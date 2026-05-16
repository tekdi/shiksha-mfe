import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportPanel from '../ExportPanel';
import useAIStudioStore from '../../../store/aiStudioStore';
import { downloadH5P } from '../../../utils/h5pPackager';
import { downloadSCORM } from '../../../utils/scormPackager';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

// Mock dependencies
jest.mock('../../../store/aiStudioStore');
jest.mock('../../../utils/h5pPackager');
jest.mock('../../../utils/scormPackager');

const mockStore = {
  generatedOutputs: {
    quiz: {
      type: 'quiz',
      questionType: 'mcq',
      questions: []
    }
  },
  setStep: jest.fn()
};

describe('ExportPanel', () => {
  beforeEach(() => {
    (useAIStudioStore as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders H5P, SCORM, and JSON export cards', () => {
    render(
      <ThemeProvider theme={theme}>
        <ExportPanel />
      </ThemeProvider>
    );
    expect(screen.getByText(/H5P Package/i)).toBeInTheDocument();
    expect(screen.getByText(/SCORM 1.2/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw JSON/i)).toBeInTheDocument();
  });

  it('shows validation success badge after successful H5P export', async () => {
    (downloadH5P as jest.Mock).mockResolvedValue({ valid: true, errors: [], warnings: [] });
    
    render(
      <ThemeProvider theme={theme}>
        <ExportPanel />
      </ThemeProvider>
    );
    const h5pBtn = screen.getByText(/Download .h5p/i);
    fireEvent.click(h5pBtn);

    await waitFor(() => {
      expect(screen.getByText(/Valid/i)).toBeInTheDocument();
    });
  });

  it('shows validation error list when H5P validation fails', async () => {
    (downloadH5P as jest.Mock).mockResolvedValue({ 
      valid: false, 
      errors: ['Question 1: Error text'], 
      warnings: [] 
    });
    
    render(
      <ThemeProvider theme={theme}>
        <ExportPanel />
      </ThemeProvider>
    );
    const h5pBtn = screen.getByText(/Download .h5p/i);
    fireEvent.click(h5pBtn);

    await waitFor(() => {
      expect(screen.getByText(/Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/View 1 Errors/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/View 1 Errors/i));
    expect(screen.getByText(/Question 1: Error text/i)).toBeInTheDocument();
  });

  it('SCORM download triggers packager', async () => {
    (downloadSCORM as jest.Mock).mockResolvedValue(undefined);
    
    render(
      <ThemeProvider theme={theme}>
        <ExportPanel />
      </ThemeProvider>
    );
    const scormBtn = screen.getByText(/Download .zip/i);
    fireEvent.click(scormBtn);

    expect(downloadSCORM).toHaveBeenCalled();
  });
});
