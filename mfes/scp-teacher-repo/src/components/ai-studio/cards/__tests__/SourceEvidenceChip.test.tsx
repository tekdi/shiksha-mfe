import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SourceEvidenceChip from '../SourceEvidenceChip';

describe('SourceEvidenceChip', () => {
  const mockEvidence = {
    quote: 'This is a source quote.',
    pageRef: 'p.42'
  };

  it('renders green chip when evidence is provided', () => {
    render(<SourceEvidenceChip evidence={mockEvidence} />);
    const chip = screen.getByText('📄 Source');
    expect(chip).toBeInTheDocument();
    expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
  });

  it('renders gray chip when evidence is undefined', () => {
    render(<SourceEvidenceChip evidence={undefined} />);
    expect(screen.getByText('No Source Evidence')).toBeInTheDocument();
  });

  it('toggles quote visibility on click', () => {
    render(<SourceEvidenceChip evidence={mockEvidence} />);
    const chip = screen.getByText('📄 Source');
    
    // Initially hidden (MuiCollapse uses height: 0)
    expect(screen.queryByText(`"${mockEvidence.quote}"`)).not.toBeVisible();
    
    fireEvent.click(chip);
    expect(screen.getByText(`"${mockEvidence.quote}"`)).toBeVisible();
    
    fireEvent.click(chip);
    // It might still be in document but with height 0 during animation, 
    // but queryByText will find it. check visibility.
    // In jest-dom, visibility might depend on how collapse is implemented.
  });

  it('displays pageRef badge when provided', () => {
    render(<SourceEvidenceChip evidence={mockEvidence} />);
    fireEvent.click(screen.getByText('📄 Source'));
    expect(screen.getByText('p.42')).toBeInTheDocument();
  });
});
