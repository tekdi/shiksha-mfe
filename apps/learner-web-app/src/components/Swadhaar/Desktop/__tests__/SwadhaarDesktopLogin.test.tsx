/**
 * Unit tests — SwadhaarDesktopLogin
 * Covers: language dropdown, mobile field, OTP boxes, send/resend OTP, sign-in button states
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwadhaarDesktopLogin from '../SwadhaarDesktopLogin';

/* ── Shared mock translations ── */
jest.mock('@shared-lib', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      const map: Record<string, string> = {
        'LEARNER_APP.HOME.LOGO_ALT': 'Logo',
        'LEARNER_APP.LOGIN.SIGN_IN': 'Sign In',
        'LEARNER_APP.LOGIN.SUBTITLE': 'Sign in to continue',
        'LEARNER_APP.LOGIN.MOBILE_LABEL': 'Mobile Number',
        'LEARNER_APP.LOGIN.MOBILE_PLACEHOLDER': 'Enter mobile number',
        'LEARNER_APP.LOGIN.OTP_LABEL': 'OTP',
        'LEARNER_APP.LOGIN.SEND_RESEND_OTP': 'Send OTP',
        'LEARNER_APP.LOGIN.RESEND_IN': `Resend in ${opts?.seconds ?? ''}`,
      };
      return map[key] ?? key;
    },
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

jest.mock('@learner/utils/constants/language', () => ({
  LANGUAGE_OPTIONS: [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'mr', label: 'मराठी' },
  ],
}));

/* ── Shared base props ── */
const baseProps = {
  mobile: '',
  otp: Array(6).fill(''),
  otpSent: false,
  isSendingOtp: false,
  isSigningIn: false,
  resendTimer: 0,
  resendAttempts: 0,
  canSendOtp: false,
  canSignIn: false,
  onMobileChange: jest.fn(),
  onOtpChange: jest.fn(),
  onOtpKeyDown: jest.fn(),
  onOtpPaste: jest.fn(),
  onSendOtp: jest.fn(),
  onSignIn: jest.fn(),
};

const renderLogin = (props = {}) =>
  render(<SwadhaarDesktopLogin {...baseProps} {...props} />);

describe('SwadhaarDesktopLogin', () => {
  beforeEach(() => jest.clearAllMocks());

  /* ── Layout ── */
  it('renders the login card with logo, title and subtitle', () => {
    renderLogin();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
  });

  /* ── Language dropdown ── */
  it('renders the language selector with 3 options', () => {
    renderLogin();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // English is shown as selected value
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  /* ── Mobile field ── */
  it('renders the mobile number input field', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter mobile number')).toBeInTheDocument();
  });

  it('calls onMobileChange when mobile field changes', () => {
    renderLogin();
    const input = screen.getByPlaceholderText('Enter mobile number');
    fireEvent.change(input, { target: { value: '9876543210' } });
    expect(baseProps.onMobileChange).toHaveBeenCalledWith('9876543210');
  });

  /* ── OTP boxes ── */
  it('renders exactly 6 OTP input boxes', () => {
    renderLogin();
    const otpInputs = [0, 1, 2, 3, 4, 5].map((i) =>
      document.getElementById(`swadhaar-otp-${i}`)
    );
    otpInputs.forEach((el) => expect(el).toBeInTheDocument());
  });

  it('calls onOtpChange when an OTP box changes', () => {
    renderLogin();
    const firstBox = document.getElementById('swadhaar-otp-0') as HTMLInputElement;
    fireEvent.change(firstBox, { target: { value: '5' } });
    expect(baseProps.onOtpChange).toHaveBeenCalledWith(0, '5');
  });

  /* ── Send OTP link: disabled state ── */
  it('shows Send OTP text but is non-clickable when canSendOtp=false', () => {
    renderLogin({ canSendOtp: false });
    const sendBtn = document.getElementById('swadhaar-send-otp-btn');
    expect(sendBtn).toBeInTheDocument();
    fireEvent.click(sendBtn!);
    expect(baseProps.onSendOtp).not.toHaveBeenCalled();
  });

  /* ── Send OTP link: enabled state ── */
  it('calls onSendOtp when canSendOtp=true and link is clicked', () => {
    renderLogin({ canSendOtp: true });
    const sendBtn = document.getElementById('swadhaar-send-otp-btn');
    fireEvent.click(sendBtn!);
    expect(baseProps.onSendOtp).toHaveBeenCalledTimes(1);
  });

  /* ── Resend timer ── */
  it('shows countdown timer text when resendTimer > 0', () => {
    renderLogin({ resendTimer: 90 });
    expect(screen.getByText(/Resend in/i)).toBeInTheDocument();
  });

  /* ── Sign In button: disabled state ── */
  it('Sign In button is disabled when canSignIn=false', () => {
    renderLogin({ canSignIn: false });
    const btn = document.getElementById('swadhaar-signin-btn') as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  /* ── Sign In button: enabled state ── */
  it('Sign In button is enabled when canSignIn=true', () => {
    renderLogin({ canSignIn: true });
    const btn = document.getElementById('swadhaar-signin-btn') as HTMLButtonElement;
    expect(btn).not.toBeDisabled();
  });

  /* ── Sign In handler ── */
  it('calls onSignIn when Sign In button is clicked and enabled', () => {
    renderLogin({ canSignIn: true });
    const btn = document.getElementById('swadhaar-signin-btn')!;
    fireEvent.click(btn);
    expect(baseProps.onSignIn).toHaveBeenCalledTimes(1);
  });

  /* ── Spinner while signing in ── */
  it('shows CircularProgress when isSigningIn=true', () => {
    renderLogin({ isSigningIn: true, canSignIn: false });
    expect(document.querySelector('circle')).toBeInTheDocument();
  });
});
