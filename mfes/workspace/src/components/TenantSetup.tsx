import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { setTenantId, getTenantId } from '../utils/tenantUtils';

interface TenantSetupProps {
  onTenantSet?: (tenantId: string) => void;
}

const TenantSetup: React.FC<TenantSetupProps> = ({ onTenantSet }) => {
  const [tenantId, setTenantIdValue] = useState(getTenantId() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim()) {
      setError('Please enter a tenant ID');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      setTenantId(tenantId.trim());
      onTenantSet?.(tenantId.trim());

      // Reload the page to reinitialize everything
      window.location.reload();
    } catch (err) {
      setError('Failed to set tenant ID');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: '0 auto', padding: 2 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" gutterBottom>
          Tenant Setup Required
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please enter your tenant ID to continue. This is required to access
          tenant-specific configurations.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Tenant ID"
            value={tenantId}
            onChange={(e) => setTenantIdValue(e.target.value)}
            placeholder="Enter your tenant ID"
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting || !tenantId.trim()}
          >
            {isSubmitting ? 'Setting Tenant ID...' : 'Set Tenant ID'}
          </Button>
        </form>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Common tenant IDs:
          <br />
          • 94f936dc-7fce-4b92-9a9b-0ebb3076793f (Colab)
          <br />
          • 6c386899-7a00-4733-8447-5ef925bbf700 (KEF)
          <br />• 3a849655-30f6-4c2b-8707-315f1ed64fbd (Atree)
        </Typography>
      </Paper>
    </Box>
  );
};

export default TenantSetup;
