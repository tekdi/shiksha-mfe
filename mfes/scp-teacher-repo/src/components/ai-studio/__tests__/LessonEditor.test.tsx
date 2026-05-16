import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonEditor from '../LessonEditor';
import useAIStudioStore from '../../../store/aiStudioStore';
import { MOCK_LESSON } from '../../../data/mockData';

// Mock the store
jest.mock('../../../store/aiStudioStore');

import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

describe('LessonEditor', () => {
  const mockUpdateOutput = jest.fn();

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  beforeEach(() => {
    (useAIStudioStore as unknown as jest.Mock).mockReturnValue({
      generatedOutputs: { lesson: MOCK_LESSON },
      updateOutput: mockUpdateOutput,
    });
  });

  it('renders slide cards from mock data', () => {
    renderWithTheme(<LessonEditor />);
    expect(screen.getByDisplayValue('What is Photosynthesis?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('The Light Reactions')).toBeInTheDocument();
  });


  it('editing a slide title updates the store', () => {
    renderWithTheme(<LessonEditor />);
    const titleInput = screen.getByDisplayValue('What is Photosynthesis?');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    expect(mockUpdateOutput).toHaveBeenCalledWith('lesson', expect.objectContaining({
      slides: expect.arrayContaining([
        expect.objectContaining({ title: 'Updated Title' })
      ])
    }));
  });

  it('adding a slide appends to the list', () => {
    renderWithTheme(<LessonEditor />);
    const addButton = screen.getByText('Add Slide');
    fireEvent.click(addButton);
    
    expect(mockUpdateOutput).toHaveBeenCalledWith('lesson', expect.objectContaining({
      slides: expect.any(Array)
    }));
    const updatedSlides = mockUpdateOutput.mock.calls.find(call => call[0] === 'lesson')[1].slides;
    expect(updatedSlides).toHaveLength((MOCK_LESSON as any).slides.length + 1);
  });

  it('deleting a slide removes from the list', () => {
    renderWithTheme(<LessonEditor />);
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockUpdateOutput).toHaveBeenCalledWith('lesson', expect.objectContaining({
      slides: expect.any(Array)
    }));
    const updatedSlides = mockUpdateOutput.mock.calls.find(call => call[0] === 'lesson')[1].slides;
    expect(updatedSlides).toHaveLength((MOCK_LESSON as any).slides.length - 1);
  });

  it('changing branding color updates the store', () => {
    renderWithTheme(<LessonEditor />);
    const colorInput = screen.getByLabelText('Primary Color');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    
    expect(mockUpdateOutput).toHaveBeenCalledWith('lesson', expect.objectContaining({
      branding: expect.objectContaining({ primaryColor: '#ff0000' })
    }));
  });

  it('preview button opens dialog with iframe', () => {
    renderWithTheme(<LessonEditor />);
    const previewButton = screen.getByText('Live Preview');
    fireEvent.click(previewButton);
    
    expect(screen.getByText('Lesson Preview')).toBeInTheDocument();
    expect(screen.getByTitle('Lesson Preview')).toBeInTheDocument(); // iframe title
  });
});
