import React, { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import CommonDialog from './CommonDialog';
import CommonTextField from './CommonTextField';
import CommonSelect from './CommonSelect';
import { updateCohort } from '@/services/CohortService';

export interface EditCohortModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedCohort: any) => void;
  cohort: {
    cohortId: string;
    name: string;
    description?: string;
    status?: string;
    [key: string]: any;
  } | null;
}

const normalizeCohortStatus = (status: string): string => {
  if (status === 'archived' || status === 'draft') return status;
  return 'active';
};

export const EditCohortModal: React.FC<EditCohortModalProps> = ({
  open,
  onClose,
  onSuccess,
  cohort,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cohort) {
      setName(cohort.name || '');
      setDescription(cohort.description || cohort.rawCohort?.description || '');
      const s = (cohort.status || 'active').toLowerCase();
      setStatus(normalizeCohortStatus(s));
      setError(null);
    }
  }, [cohort, open]);

  const handleSubmit = async () => {
    if (!cohort?.cohortId) return;
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: name.trim(),
        status: status.toLowerCase(),
      };
      if (description !== undefined) {
        payload.description = description.trim();
      }

      const res = await updateCohort(cohort.cohortId, payload);
      onSuccess(res || { ...cohort, ...payload });
      onClose();
    } catch (err: any) {
      console.error('Failed to update cohort:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Edit Group"
      subtitle="Update group details and lifecycle status"
      onConfirm={handleSubmit}
      confirmLabel={loading ? 'Saving...' : 'Save Changes'}
      confirmDisabled={loading || !name.trim()}
      loading={loading}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <CommonTextField
          id="cohort-edit-name"
          label="Group Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pune Batch A - Financial Literacy"
        />

        <CommonTextField
          id="cohort-edit-description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of this group's objective or target beneficiaries..."
          multiline
          rows={3}
        />

        <CommonSelect
          id="cohort-edit-status"
          label="Lifecycle Status"
          value={status}
          onChange={(val) => setStatus(val)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </Box>
    </CommonDialog>
  );
};

export default EditCohortModal;
