import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import React, { memo, ReactNode } from 'react';

interface LoaderProps {
  isLoading: boolean;
  layoutHeight?: number;
  children?: ReactNode;
  _loader?: React.CSSProperties;
  _children?: React.CSSProperties;
  _childrenBox?: any;
  isHideMaxHeight?: boolean;
  /** Accessible label announced by screen readers while loading. */
  loadingLabel?: string;
}

export const Loader: React.FC<LoaderProps> = memo(
  ({
    isLoading,
    layoutHeight,
    _loader,
    _children,
    _childrenBox,
    children,
    isHideMaxHeight,
    loadingLabel = 'Loading',
  }) => {
    return (
      <>
        {isLoading && (
          <Box
            role="status"
            aria-live="polite"
            aria-busy="true"
            sx={{
              width: '100%',
              minHeight: `calc(100vh - ${layoutHeight || 0}px)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
              ..._loader,
            }}
          >
            <CircularProgress aria-label={loadingLabel} />
          </Box>
        )}
        <Box
          {..._childrenBox}
          sx={{
            width: '100%',
            overflowY: 'auto',
            display: isLoading ? 'none' : 'block',
            ...(isLoading || !isHideMaxHeight
              ? { height: `calc(100vh - ${layoutHeight}px)` }
              : {}),
            ..._children,
          }}
        >
          {children}
        </Box>
      </>
    );
  }
);
