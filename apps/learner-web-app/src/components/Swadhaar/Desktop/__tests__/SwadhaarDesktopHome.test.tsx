/**
 * Unit tests — SwadhaarDesktopHome
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwadhaarDesktopHome from '../SwadhaarDesktopHome';

/* ── Mocks ── */
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      const map: Record<string, string> = {
        'LEARNER_APP.HOME.GREETING': `Namaste, ${opts?.name ?? ''}!`,
        'LEARNER_APP.PROFILE.FIELD_DESIGNATION': 'Designation',
        'LEARNER_APP.HOME.LOCKED': 'Locked',
        'LEARNER_APP.HOME.COMPLETED': 'Completed',
        'LEARNER_APP.HOME.PROGRESS_TEXT': `Progress: ${opts?.percent ?? 0}% Completed`,
        'LEARNER_APP.ALERTS.TITLE': 'Alerts',
        'LEARNER_APP.HOME.ALERTS_TITLE': 'Alerts & Updates',
        'LEARNER_APP.ALERTS.NO_NOTIFICATIONS': 'No notifications yet',
        'LEARNER_APP.LEARN.CURRENT_LABEL': `Current: ${opts?.name}`,
        'LEARNER_APP.HOME.START_LEARNING': 'Start Learning',
        'LEARNER_APP.HOME.CONTINUE_LEARNING': 'Continue Learning',
        'LEARNER_APP.LEARN.LESSON_LABEL': `Lesson: ${opts?.name}`,
        'LEARNER_APP.LEARN.COMPLETED_MODULES': `Completed ${opts?.completed}/${opts?.total} Modules`,
        'LEARNER_APP.LEARN.LESSONS_TITLE': 'Lessons',
        'LEARNER_APP.HOME.TITLE': 'Home',
        'LEARNER_APP.ALERTS.LOCKED_MESSAGE': 'Complete previous course to unlock.',
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock('@learner/utils/API/SwadhaarService', () => ({
  trackCourseClick: jest.fn().mockResolvedValue({}),
}));

jest.mock('@learner/components/Profile/ProfileAvatar', () => ({
  __esModule: true,
  default: ({ initials }: any) => <div data-testid="avatar">{initials}</div>,
}));

jest.mock('@learner/components/ConfirmationModal/ConfirmationModal', () => ({
  __esModule: true,
  default: ({ modalOpen, handleAction, handleCloseModal }: any) =>
    modalOpen ? (
      <div data-testid="confirm-modal">
        <button onClick={handleAction}>Confirm</button>
        <button onClick={handleCloseModal}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock('../SwadhaarDesktopEditProfileModal', () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close</button></div> : null,
}));

jest.mock('../SwadhaarDesktopAlertsPanel', () => ({
  __esModule: true,
  default: ({ onClose }: any) => <div data-testid="alerts-panel"><button onClick={onClose}>Close Alerts</button></div>,
}));


/* ── Test data ── */
const mockLevel = {
  id: 'l1',
  name: 'Beginner Level',
  completedModules: 0,
  totalModules: 2,
  completionPercentage: 0,
  isUnlocked: true,
  rawChildren: [
    {
      identifier: 'm1',
      name: 'Credit & Borrowing',
      children: [
        {
          identifier: 'st1',
          name: 'Subtopic 1',
          children: [{ identifier: 'ls1', name: 'Lesson 1', children: [] }],
        },
      ],
    },
  ],
};

const baseProps = {
  levels: [mockLevel],
  activeLevel: mockLevel,
  statusData: [],
  alerts: [],
  unreadCount: 0,
  userName: 'Priya',
  designation: 'Trainer',
  profileImageUrl: null,
  isLoading: false,
  error: null,
  onAlertClick: jest.fn(),
  onReload: jest.fn(),
};

describe('SwadhaarDesktopHome', () => {
  beforeEach(() => { mockPush.mockClear(); jest.clearAllMocks(); });

  it('renders the desktop home container', () => {
    render(<SwadhaarDesktopHome {...baseProps} />);
    expect(document.getElementById('swadhaar-desktop-home')).toBeInTheDocument();
  });

  it('renders profile banner with user greeting', () => {
    render(<SwadhaarDesktopHome {...baseProps} />);
    expect(screen.getByText('Namaste, Priya!')).toBeInTheDocument();
  });

  it('renders "Learning Progress" section heading', () => {
    render(<SwadhaarDesktopHome {...baseProps} />);
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
  });

  it('renders level accordion for each level', () => {
    render(<SwadhaarDesktopHome {...baseProps} />);
    // "Beginner Level" appears in both the profile banner chip and the accordion header.
    // Use getAllByText to handle multiple matches gracefully.
    const matches = screen.getAllByText('Beginner Level');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders current lesson card when active lesson exists', () => {
    render(<SwadhaarDesktopHome {...baseProps} />);
    expect(screen.getByText('Current: Subtopic 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
  });

  it('does NOT render alerts panel when sidebar is closed (default)', () => {
    render(<SwadhaarDesktopHome {...baseProps} alerts={[]} />);
    expect(screen.queryByTestId('alerts-panel')).not.toBeInTheDocument();
  });

  it('opens alerts sidebar when Alerts button is clicked', () => {
    render(<SwadhaarDesktopHome {...baseProps} unreadCount={1} />);
    fireEvent.click(document.getElementById('swadhaar-header-alerts-btn')!);
    expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
  });

  it('shows "Start Learning" on lesson card when no progress', () => {
    render(<SwadhaarDesktopHome {...baseProps} />);
    expect(screen.getByText('Start Learning')).toBeInTheDocument();
  });

  it('shows "Continue Learning" when lesson has progress', () => {
    const statusData = [{ contentId: 'ls1', status: 1, completionPercentage: 40 }];
    render(<SwadhaarDesktopHome {...baseProps} statusData={statusData} />);
    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
  });

  it('shows Retry link when error is set', () => {
    render(<SwadhaarDesktopHome {...baseProps} error="Load failed" />);
    expect(screen.getByText('Load failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls onReload when Retry is clicked', () => {
    render(<SwadhaarDesktopHome {...baseProps} error="Load failed" />);
    fireEvent.click(screen.getByText('Retry'));
    expect(baseProps.onReload).toHaveBeenCalledTimes(1);
  });

  it('closes alerts sidebar when close is clicked', () => {
    render(<SwadhaarDesktopHome {...baseProps} unreadCount={1} />);
    fireEvent.click(document.getElementById('swadhaar-header-alerts-btn')!);
    expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Alerts'));
    expect(screen.queryByTestId('alerts-panel')).not.toBeInTheDocument();
  });
});
