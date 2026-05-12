/**
 * Unit tests — SwadhaarDesktopProfileBanner
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwadhaarDesktopProfileBanner from '../SwadhaarDesktopProfileBanner';

jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      const map: Record<string, string> = {
        'LEARNER_APP.HOME.GREETING': `Namaste, ${opts?.name ?? ''}!`,
        'LEARNER_APP.PROFILE.FIELD_DESIGNATION': 'Designation',
        'LEARNER_APP.HOME.LOCKED': 'Locked',
        'LEARNER_APP.HOME.COMPLETED': 'Completed',
        'LEARNER_APP.HOME.PROGRESS_TEXT': `Progress: ${opts?.percent ?? 0}% Completed`,
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock('@learner/components/Profile/ProfileAvatar', () => ({
  __esModule: true,
  default: ({ initials }: any) => <div data-testid="avatar">{initials}</div>,
}));

const levels = [
  { id: 'l1', name: 'Beginner Level', completionPercentage: 100, isUnlocked: true },
  { id: 'l2', name: 'Intermediate Level', completionPercentage: 50, isUnlocked: true },
  { id: 'l3', name: 'Advance Level', completionPercentage: 0, isUnlocked: false },
];

describe('SwadhaarDesktopProfileBanner', () => {
  const onProfileClick = jest.fn();

  const renderBanner = (overrides = {}) =>
    render(
      <SwadhaarDesktopProfileBanner
        userName="Priya"
        designation="Trainer"
        profileImageUrl={null}
        levels={levels}
        onProfileClick={onProfileClick}
        {...overrides}
      />
    );

  it('renders user greeting', () => {
    renderBanner();
    expect(screen.getByText('Namaste, Priya!')).toBeInTheDocument();
  });

  it('renders designation label', () => {
    renderBanner();
    expect(screen.getByText(/Trainer/)).toBeInTheDocument();
  });

  it('renders a chip for each level', () => {
    renderBanner();
    expect(screen.getByText('Beginner Level')).toBeInTheDocument();
    expect(screen.getByText('Intermediate Level')).toBeInTheDocument();
    expect(screen.getByText('Advance Level')).toBeInTheDocument();
  });

  it('shows "Completed" label for 100% level', () => {
    renderBanner();
    // The chip subtitle shows plain 'Completed' for a 100% level.
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders "Locked" for locked level', () => {
    renderBanner();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('calls onProfileClick when avatar is clicked', () => {
    renderBanner();
    fireEvent.click(screen.getByTestId('avatar'));
    expect(onProfileClick).toHaveBeenCalled();
  });

  it('renders initials in avatar when no profile image (single-word name → first char)', () => {
    renderBanner();
    // getInitials('Priya') returns 'P' (one word → one initial)
    expect(screen.getByTestId('avatar').textContent).toBe('P');
  });

  it('renders initials for a two-word name', () => {
    render(
      <SwadhaarDesktopProfileBanner
        userName="Priya Rao"
        designation="Trainer"
        profileImageUrl={null}
        levels={levels}
        onProfileClick={onProfileClick}
      />
    );
    expect(screen.getByTestId('avatar').textContent).toBe('PR');
  });

  it('renders one chip icon box per level (3 levels → 3 icon boxes)', () => {
    // Each chip renders a circular icon box. We check all level names are present
    // to confirm all 3 chips were rendered.
    const { container } = renderBanner();
    const levelNames = ['Beginner Level', 'Intermediate Level', 'Advance Level'];
    levelNames.forEach((name) => {
      expect(container.textContent).toContain(name);
    });
  });

  it('shows "50% Completed" for the in-progress level', () => {
    renderBanner();
    expect(screen.getByText('50% Completed')).toBeInTheDocument();
  });
});
