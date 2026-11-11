/**
 * Unit tests — SwadhaarDesktopHeader
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwadhaarDesktopHeader from '../SwadhaarDesktopHeader';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'LEARNER_APP.HOME.LOGO_ALT': 'Logo',
      'LEARNER_APP.ALERTS.TITLE': 'Alerts',
      'LEARNER_APP.PROFILE.TITLE': 'Profile',
    }[key] ?? key),
  }),
}));

const mockOnAlertsClick = jest.fn();
const mockOnEditProfile = jest.fn();
const mockOnLogout = jest.fn();

const defaultProps = {
  unreadCount: 0,
  alertsPanelOpen: false,
  onAlertsClick: mockOnAlertsClick,
  onEditProfile: mockOnEditProfile,
  onLogout: mockOnLogout,
};

describe('SwadhaarDesktopHeader', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockOnAlertsClick.mockClear();
    mockOnEditProfile.mockClear();
    mockOnLogout.mockClear();
  });

  it('renders Alerts and Profile labels', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} />);
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('calls onAlertsClick when Alerts button is clicked', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} />);
    fireEvent.click(document.getElementById('swadhaar-header-alerts-btn')!);
    expect(mockOnAlertsClick).toHaveBeenCalledTimes(1);
  });

  it('opens profile dropdown when Profile button is clicked', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} />);
    fireEvent.click(document.getElementById('swadhaar-header-profile-btn')!);
    expect(document.getElementById('swadhaar-header-profile-menu')).toBeInTheDocument();
  });

  it('calls onEditProfile when Edit Profile is clicked', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} />);
    fireEvent.click(document.getElementById('swadhaar-header-profile-btn')!);
    fireEvent.click(document.getElementById('swadhaar-header-edit-profile-btn')!);
    expect(mockOnEditProfile).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when Logout is clicked', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} />);
    fireEvent.click(document.getElementById('swadhaar-header-profile-btn')!);
    fireEvent.click(document.getElementById('swadhaar-header-logout-btn')!);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('shows badge count when unreadCount > 0', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show badge when unreadCount is 0', () => {
    render(<SwadhaarDesktopHeader {...defaultProps} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
