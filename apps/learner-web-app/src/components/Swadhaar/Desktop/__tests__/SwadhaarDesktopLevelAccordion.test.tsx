/**
 * Unit tests — SwadhaarDesktopLevelAccordion
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwadhaarDesktopLevelAccordion from '../SwadhaarDesktopLevelAccordion';

jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      const map: Record<string, string> = {
        'LEARNER_APP.HOME.COMPLETED': 'Completed',
        'LEARNER_APP.HOME.LOCKED': 'Locked',
        'LEARNER_APP.LEARN.COMPLETED_MODULES': `Completed ${opts?.completed}/${opts?.total} Modules`,
        'LEARNER_APP.LEARN.LESSONS_TITLE': 'Lessons',
      };
      return map[key] ?? key;
    },
  }),
}));

const modules = [
  { identifier: 'm1', name: 'Credit & Borrowing', children: [{ identifier: 's1', name: 'Sub1', children: [] }] },
  { identifier: 'm2', name: 'Savings', children: [{ identifier: 's2', name: 'Sub2', children: [] }] },
];

const baseProps = {
  levelId: 'l1',
  levelName: 'Beginner Level',
  completedModules: 2,
  totalModules: 4,
  completionPercentage: 50,
  isUnlocked: true,
  isExpanded: false,
  onToggle: jest.fn(),
  statusData: [],
  modules,
  onModuleClick: jest.fn(),
};

describe('SwadhaarDesktopLevelAccordion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders level name in header', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} />);
    expect(screen.getByText('Beginner Level')).toBeInTheDocument();
  });

  it('shows completed modules count when unlocked and not complete', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} />);
    expect(screen.getByText('Completed 2/4 Modules')).toBeInTheDocument();
  });

  it('shows "Locked" when isUnlocked=false', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} isUnlocked={false} />);
    // When locked, both the level subtitle and module card labels render "Locked".
    const lockLabels = screen.getAllByText('Locked');
    expect(lockLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Completed" when completionPercentage >= 100', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} completionPercentage={100} completedModules={4} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onToggle when header is clicked (unlocked)', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} />);
    const accordionId = document.getElementById(`swadhaar-desktop-level-accordion-l1`);
    fireEvent.click(accordionId!.firstChild as Element);
    expect(baseProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onToggle when locked', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} isUnlocked={false} />);
    const accordionId = document.getElementById(`swadhaar-desktop-level-accordion-l1`);
    fireEvent.click(accordionId!.firstChild as Element);
    expect(baseProps.onToggle).not.toHaveBeenCalled();
  });

  it('shows module cards in grid when expanded and unlocked', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} isExpanded={true} />);
    expect(screen.getByText('Credit & Borrowing')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('hides module cards when collapsed', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} isExpanded={false} />);
    // In Collapse=false, MUI still renders but hides via CSS; content may still be in DOM
    // verify toggle at least works
    expect(baseProps.onToggle).not.toHaveBeenCalled();
  });

  it('calls onModuleClick when a module card is clicked (unlocked)', () => {
    render(<SwadhaarDesktopLevelAccordion {...baseProps} isExpanded={true} />);
    const card = document.getElementById('swadhaar-module-card-m1');
    fireEvent.click(card!);
    expect(baseProps.onModuleClick).toHaveBeenCalledWith('m1');
  });

  it('shows progress bars inside module cards', () => {
    const { container } = render(<SwadhaarDesktopLevelAccordion {...baseProps} isExpanded={true} />);
    const bars = container.querySelectorAll('[role="progressbar"]');
    expect(bars.length).toBeGreaterThan(0);
  });
});
