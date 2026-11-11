/**
 * Unit tests — CFL Desktop Components
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CFLDesktopHeader from '../CFLDesktopHeader';
import CFLDesktopStatsCard from '../CFLDesktopStatsCard';
import CFLDesktopHome from '../CFLDesktopHome';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'LEARNER_APP.HOME.LOGO_ALT': 'Logo',
    }[key] ?? key),
  }),
}));

describe('CFLDesktopHeader', () => {
  it('renders title and labels', () => {
    render(<CFLDesktopHeader onLogout={jest.fn()} />);
    expect(screen.getByText('CFL Incharge')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('calls onLogout when logout is clicked in dropdown', () => {
    const mockOnLogout = jest.fn();
    render(<CFLDesktopHeader onLogout={mockOnLogout} />);
    fireEvent.click(screen.getByText('Profile'));
    fireEvent.click(screen.getByText('Logout'));
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });
});

describe('CFLDesktopStatsCard', () => {
  it('renders total and completed counts', () => {
    render(<CFLDesktopStatsCard totalTrainers={10} completedTrainers={4} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
  });
});

describe('CFLDesktopHome', () => {
  const trainers = [
    { id: '1', name: 'Trainer One', progress: 50 },
    { id: '2', name: 'Trainer Two', progress: 100 }
  ];

  it('renders welcome message and trainer list', () => {
    render(
      <CFLDesktopHome
        trainers={trainers}
        loading={false}
        error={null}
        username="Test User"
        location="Test Location"
      />
    );
    expect(screen.getByText('Hello, Test User')).toBeInTheDocument();
    expect(screen.getByText('Trainer One')).toBeInTheDocument();
    expect(screen.getByText('Trainer Two')).toBeInTheDocument();
  });

  it('toggles between Trainer and Content progress views', () => {
    render(
      <CFLDesktopHome
        trainers={trainers}
        loading={false}
        error={null}
        username="Test User"
        location="Test Location"
      />
    );
    fireEvent.click(screen.getByText('Content Progress'));
    expect(screen.getByText('New Content Progress')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trainer Progress'));
    expect(screen.getByText('Trainer List')).toBeInTheDocument();
  });
});
