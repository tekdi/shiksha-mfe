import React from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
              border: '2px solid #ff6b6b',
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ff6b6b', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#1a1a1a' }}>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 3, lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try refreshing the page or contact support
              if the problem persists.
            </Typography>
            {this.state.error && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  border: '1px solid #ff6b6b',
                  textAlign: 'left',
                  maxHeight: 120,
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666' }}>
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.resetError}
              sx={{
                bgcolor: '#ff6b6b',
                '&:hover': { bgcolor: '#ff5252' },
              }}
            >
              Refresh Page
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
