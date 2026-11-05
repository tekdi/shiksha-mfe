import React from 'react';

export const REQUIRED_COLOR = '#D92D20';

/** Renders a label with its mandatory marker in red; accepts text that already ends with " *". */
export const renderRequiredLabel = (label: React.ReactNode, required = false): React.ReactNode => {
  if (typeof label === 'string' && label.endsWith(' *')) {
    return (
      <>
        {label.slice(0, -2)}
        <span style={{ color: REQUIRED_COLOR }}> *</span>
      </>
    );
  }
  return (
    <>
      {label}
      {required && <span style={{ color: REQUIRED_COLOR }}> *</span>}
    </>
  );
};
