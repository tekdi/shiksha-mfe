import { toast } from 'react-toastify';

const options = {
  position: 'bottom-center',
  hideProgressBar: true,
  closeButton: false,
  autoClose: 2500,
};

const baseStyle = {
  color: '#fff',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
};

// Toast function and background colour for each supported type.
const TOAST_VARIANTS = {
  error: { show: toast.error, background: '#DC3545' },
  success: { show: toast.success, background: '#28A745' },
  info: { show: toast.info, background: '#1A1A1A' },
  warning: { show: toast.warning, background: '#E6873C' },
};

export const showToastMessage = (message, type = 'success') => {
  const commonOptions = { ...options, style: baseStyle };
  const variant = TOAST_VARIANTS[type];

  if (!variant) {
    toast(message, commonOptions);
    return;
  }

  variant.show(message, {
    ...commonOptions,
    style: { ...baseStyle, background: variant.background },
  });
};
