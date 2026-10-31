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

const toDateInput = (value?: string | null): string => (value ? String(value).slice(0, 10) : '');

const readDescription = (cohort: EditCohortModalProps['cohort']): string => {
  if (!cohort) return '';
  const direct = cohort.description || cohort.rawCohort?.description;
  if (direct) return direct;
  try {
    const metadata = cohort.rawCohort?.metadata;
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return parsed?.description || '';
  } catch {
    return '';
  }
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cohort) {
      setName(cohort.name || '');
      setDescription(readDescription(cohort));
      setStartDate(toDateInput(cohort.rawCohort?.cohort_startDate));
      setEndDate(toDateInput(cohort.rawCohort?.cohort_endDate));
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

    if (startDate && endDate && endDate < startDate) {
      setError('End date cannot be before the start date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The API answers 409 when the name is re-sent unchanged, so send only edited fields
      const payload: any = {};
      const original = cohort.rawCohort || cohort;
      if (name.trim() !== (cohort.name || '').trim()) payload.name = name.trim();
      if (status.toLowerCase() !== normalizeCohortStatus((cohort.status || 'active').toLowerCase())) {
        payload.status = status.toLowerCase();
      }
      if (description.trim() !== readDescription(cohort).trim()) {
        // The update API has no description column; it lives in metadata
        payload.metadata = JSON.stringify({ description: description.trim() });
      }
      if (startDate && startDate !== toDateInput(original.cohort_startDate)) {
        payload.cohort_startDate = startDate;
      }
      if (endDate && endDate !== toDateInput(original.cohort_endDate)) {
        payload.cohort_endDate = endDate;
      }
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <CommonTextField
            id="cohort-edit-start-date"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <CommonTextField
            id="cohort-edit-end-date"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            inputProps={{ min: startDate || undefined }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

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
