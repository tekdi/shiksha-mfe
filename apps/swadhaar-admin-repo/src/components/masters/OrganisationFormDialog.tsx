import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { useTranslation } from 'next-i18next';
import CommonDialog from '@/components/common/CommonDialog';
import CommonTextField from '@/components/common/CommonTextField';
import { createOrganisation, Organisation, updateOrganisation } from '@/services/MastersService';
import { apiErrorMessage } from '@/utils/concurrency';
import {
  cleanText,
  FormErrors,
  hasErrors,
  ORG_NAME_MAX,
  OrganisationForm,
  validateOrganisationForm,
} from '@/utils/masters';

export interface OrganisationSaved {
  organisation: Organisation;
  mode: 'create' | 'edit';
  /** On a rename: how many users' stored org name changed */
  usersUpdated?: number;
}

export interface OrganisationFormDialogProps {
  open: boolean;
  /** The org to edit; none to add a new one */
  organisation?: Organisation | null;
  onClose: () => void;
  onSaved: (saved: OrganisationSaved) => void;
}

const EMPTY: OrganisationForm = { code: '', name: '' };

/** Add an org (code and name), or rename one. The code can't change once created. */
const OrganisationFormDialog: React.FC<OrganisationFormDialogProps> = ({ open, organisation, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(organisation);
  const [form, setForm] = useState<OrganisationForm>(EMPTY);
  const [errors, setErrors] = useState<FormErrors<OrganisationForm>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(organisation ? { code: organisation.code, name: organisation.name } : EMPTY);
    setErrors({});
    setServerError(null);
  }, [open, organisation]);

  const setField = (field: keyof OrganisationForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    const found = validateOrganisationForm(form, { isEdit });
    setErrors(found);
    if (hasErrors(found)) return;
    if (organisation && cleanText(form.name) === organisation.name) {
      onClose();
      return;
    }

    setSaving(true);
    setServerError(null);
    try {
      if (organisation) {
        const result = await updateOrganisation(organisation.organisationId, { name: form.name });
        onSaved({ organisation: result.organisation, mode: 'edit', usersUpdated: result.usersUpdated });
      } else {
        onSaved({ organisation: await createOrganisation(form), mode: 'create' });
      }
    } catch (err) {
      setServerError(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const userCount = organisation?.userCount ?? 0;

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t(isEdit ? 'ADMINISTRATION.ORG.EDIT_TITLE' : 'ADMINISTRATION.ORG.CREATE_TITLE')}
      onConfirm={handleSave}
      confirmLabel={t(isEdit ? 'COMMON.SAVE' : 'ADMINISTRATION.ORG.CREATE_CONFIRM')}
      loading={saving}
      disableBackdropClose
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <CommonTextField
          id="org-code"
          label={t('ADMINISTRATION.ORG.CODE')}
          required={!isEdit}
          disabled={isEdit}
          value={form.code}
          onChange={setField('code')}
          error={Boolean(errors.code)}
          helperText={errors.code && t(errors.code)}
          hint={isEdit ? undefined : t('ADMINISTRATION.ORG.CODE_HINT')}
          inputProps={{ maxLength: 10 }}
        />
        <CommonTextField
          id="org-name"
          label={t('ADMINISTRATION.ORG.NAME')}
          required
          value={form.name}
          onChange={setField('name')}
          error={Boolean(errors.name)}
          helperText={errors.name && t(errors.name)}
          inputProps={{ maxLength: ORG_NAME_MAX }}
        />
        {isEdit && userCount > 0 && (
          <Alert severity="info">{t('ADMINISTRATION.ORG.RENAME_NOTE', { count: userCount })}</Alert>
        )}
      </Box>
    </CommonDialog>
  );
};

export default OrganisationFormDialog;
