import React, { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { useTranslation } from 'next-i18next';
import CommonDialog from './CommonDialog';
import CommonTextField from './CommonTextField';
import CommonSelect from './CommonSelect';
import { getCohortById, updateCohort } from '@/services/CohortService';

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
  if (status === 'archived' || status === 'inactive') return status;
  if (status === 'draft') return 'inactive'; // draft is no longer an accepted status
  return 'active';
};

const toDateInput = (value?: string | null): string => (value ? String(value).slice(0, 10) : '');

const readDescription = (cohort: any): string => {
  if (!cohort) return '';
  const direct = cohort.description || cohort.rawCohort?.description;
  if (direct) return direct;
  try {
    const metadata = cohort.rawCohort?.metadata ?? cohort.metadata;
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
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The group as the server has it (POST /user/v1/cohort/search by cohortId), loaded when the dialog opens
  const [saved, setSaved] = useState<any>(null);

  const fillForm = (source: any) => {
    setName(source.name || '');
    setDescription(readDescription(source));
    setStartDate(toDateInput(source.cohort_startDate ?? source.rawCohort?.cohort_startDate));
    setEndDate(toDateInput(source.cohort_endDate ?? source.rawCohort?.cohort_endDate));
    setStatus(normalizeCohortStatus((source.status || 'active').toLowerCase()));
  };

  useEffect(() => {
    if (!open || !cohort) return;
    setError(null);
    setSaved(cohort.rawCohort || cohort);
    fillForm(cohort);
    let cancelled = false;
    getCohortById(cohort.cohortId)
      .then((details) => {
        if (cancelled || !details) return;
        setSaved(details);
        fillForm(details);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [cohort, open]);

  const handleSubmit = async () => {
    if (!cohort?.cohortId) return;
    if (!name.trim()) {
      setError(t('COHORTS.EDIT.ERROR_NAME_REQUIRED'));
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError(t('COHORTS.EDIT.ERROR_END_BEFORE_START'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The API answers 409 when the name is re-sent unchanged, so send only edited fields
      const payload: any = {};
      const original = saved || cohort;
      if (name.trim() !== (original.name || '').trim()) payload.name = name.trim();
      if (status.toLowerCase() !== normalizeCohortStatus((original.status || 'active').toLowerCase())) {
        payload.status = status.toLowerCase();
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
      setError(err?.response?.data?.message || err?.message || t('COHORTS.EDIT.ERROR_UPDATE_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t('COHORTS.EDIT.TITLE')}
      subtitle={t('COHORTS.EDIT.SUBTITLE')}
      onConfirm={handleSubmit}
      confirmLabel={loading ? t('COHORTS.EDIT.SAVING') : t('COHORTS.EDIT.SAVE')}
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
          label={t('COHORTS.EDIT.GROUP_NAME')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('COHORTS.EDIT.GROUP_NAME_PLACEHOLDER')}
        />

        <CommonTextField
          id="cohort-edit-description"
          label={t('COHORTS.EDIT.DESCRIPTION')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('COHORTS.EDIT.DESCRIPTION_PLACEHOLDER')}
          multiline
          rows={3}
          disabled
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <CommonTextField
            id="cohort-edit-start-date"
            label={t('COHORTS.EDIT.START_DATE')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <CommonTextField
            id="cohort-edit-end-date"
            label={t('COHORTS.EDIT.END_DATE')}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            inputProps={{ min: startDate || undefined }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <CommonSelect
          id="cohort-edit-status"
          label={t('COHORTS.EDIT.LIFECYCLE_STATUS')}
          value={status}
          onChange={(val) => setStatus(val)}
          options={[
            { value: 'active', label: t('LIFECYCLE.ACTIVE') },
            { value: 'inactive', label: t('LIFECYCLE.INACTIVE') },
            { value: 'archived', label: t('LIFECYCLE.ARCHIVED') },
          ]}
        />
      </Box>
    </CommonDialog>
  );
};

export default EditCohortModal;
