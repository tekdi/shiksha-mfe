/**
 * Unit tests — SwadhaarDesktopAlertsPanel (updated for new API-driven props)
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwadhaarDesktopAlertsPanel from '../SwadhaarDesktopAlertsPanel';

// Mock API modules
jest.mock('@learner/utils/alertsStore', () => ({
  getAlerts: jest.fn(() => []),
  markAsRead: jest.fn(),
  markAllAsReadLocal: jest.fn(),
  fetchAndSyncAlerts: jest.fn().mockResolvedValue([]),
}));

jest.mock('@learner/utils/API/NotificationService', () => ({
  markNotificationsRead: jest.fn().mockResolvedValue({}),
}));

jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'LEARNER_APP.ALERTS.TITLE': 'Alerts & Updates',
        'LEARNER_APP.ALERTS.NO_NOTIFICATIONS': 'No notifications yet',
        'LEARNER_APP.ALERTS.LOCKED_MESSAGE': 'Complete previous course to unlock.',
      }[key] ?? key),
  }),
}));

const defaultProps = {
  userId: 'test-user-123',
  onClose: jest.fn(),
};

describe('SwadhaarDesktopAlertsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: fetchAndSyncAlerts resolves with empty list
    const alertsStore = require('@learner/utils/alertsStore');
    alertsStore.fetchAndSyncAlerts.mockResolvedValue([]);
  });

  it('renders panel with header', async () => {
    render(<SwadhaarDesktopAlertsPanel {...defaultProps} />);
    expect(document.getElementById('swadhaar-desktop-alerts-panel')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(<SwadhaarDesktopAlertsPanel {...defaultProps} onClose={onClose} />);
    // Close button is an IconButton — find by title
    const closeBtn = document.querySelector('[title="Close"]') as HTMLElement;
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
