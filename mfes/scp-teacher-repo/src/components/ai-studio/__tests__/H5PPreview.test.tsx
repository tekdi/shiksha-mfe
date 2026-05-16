import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import H5PPreview from '../H5PPreview';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

describe('H5PPreview', () => {
  const mockContent = {
    questions: [
      {
        question: 'What is 2+2?',
        answers: [{ text: '4', correct: true }, { text: '5', correct: false }]
      },
      {
        sentence: 'The sky is *blue*.',
        blanks: [{ answer: 'blue' }]
      }
    ]
  };

  it('opens dialog when open prop is true', () => {
    render(
      <ThemeProvider theme={theme}>
        <H5PPreview contentJson={mockContent} open={true} onClose={() => {}} />
      </ThemeProvider>
    );
    expect(screen.getByText('H5P Interactive Preview')).toBeInTheDocument();
  });

  it('closes dialog when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <ThemeProvider theme={theme}>
        <H5PPreview contentJson={mockContent} open={true} onClose={handleClose} />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByTestId('CloseIcon').parentElement!);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders MCQ questions with radio buttons', () => {
    render(
      <ThemeProvider theme={theme}>
        <H5PPreview contentJson={mockContent} open={true} onClose={() => {}} />
      </ThemeProvider>
    );
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByLabelText('4')).toBeInTheDocument();
    expect(screen.getByLabelText('5')).toBeInTheDocument();
  });

  it('renders FITB questions with input fields', () => {
    render(
      <ThemeProvider theme={theme}>
        <H5PPreview contentJson={mockContent} open={true} onClose={() => {}} />
      </ThemeProvider>
    );
    expect(screen.getByText(/The sky is/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('...')).toBeInTheDocument();
  });
});
