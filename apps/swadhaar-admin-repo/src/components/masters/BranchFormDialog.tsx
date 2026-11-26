import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { useTranslation } from 'next-i18next';
import CommonDialog from '@/components/common/CommonDialog';
import CommonSelect from '@/components/common/CommonSelect';
import CommonTextField from '@/components/common/CommonTextField';
import {
  Branch,
  createBranch,
  listDistricts,
  listStates,
  LocationOption,
  updateBranch,
} from '@/services/MastersService';
import { apiErrorMessage } from '@/utils/concurrency';
import {
  BRANCH_NAME_MAX,
  BranchForm,
  cleanText,
  FormErrors,
  hasErrors,
  validateBranchForm,
} from '@/utils/masters';

export interface BranchSaved {
  branch: Branch;
  mode: 'create' | 'edit';
}

export interface BranchFormDialogProps {
  open: boolean;
  /** The branch to edit; none to add a new one */
  branch?: Branch | null;
  onClose: () => void;
  onSaved: (saved: BranchSaved) => void;
}

const EMPTY: BranchForm = { stateValue: '', districtValue: '', code: '', name: '' };
const NONE = '-';

const toOptions = (items: LocationOption[]) => items.map((item) => ({ value: item.value, label: item.name }));

/**
 * Add a branch: pick a state and district from the master list, then enter the branch code and
 * name. Editing changes only the name; state, district and code are locked once created.
 */
const BranchFormDialog: React.FC<BranchFormDialogProps> = ({ open, branch, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(branch);
  const [form, setForm] = useState<BranchForm>(EMPTY);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [errors, setErrors] = useState<FormErrors<BranchForm>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      branch
        ? { stateValue: branch.stateValue ?? '', districtValue: branch.districtValue, code: branch.code ?? '', name: branch.name }
        : EMPTY
    );
    setErrors({});
    setServerError(null);
    if (!branch) {
      listStates()
        .then(setStates)
        .catch((err) => setServerError(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.LOAD_FAILED')));
    }
  }, [open, branch, t]);

  useEffect(() => {
    if (!open || isEdit || !form.stateValue) {
      setDistricts([]);
      return;
    }
    let current = true;
    listDistricts(form.stateValue)
      .then((items) => current && setDistricts(items))
      .catch((err) => current && setServerError(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.LOAD_FAILED')));
    return () => {
      current = false;
    };
  }, [open, isEdit, form.stateValue, t]);

  const update = (changes: Partial<BranchForm>) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(changes) as (keyof BranchForm)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  const handleSave = async () => {
    const found = validateBranchForm(form, { isEdit });
    setErrors(found);
    if (hasErrors(found)) return;
    if (branch && cleanText(form.name) === branch.name) {
      onClose();
      return;
    }

    setSaving(true);
    setServerError(null);
    try {
      if (branch) {
        onSaved({ branch: await updateBranch(branch.value, { name: form.name }), mode: 'edit' });
      } else {
        onSaved({ branch: await createBranch(form), mode: 'create' });
      }
    } catch (err) {
      setServerError(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (field: keyof BranchForm) => errors[field] && t(errors[field] as string);

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t(isEdit ? 'ADMINISTRATION.BRANCH.EDIT_TITLE' : 'ADMINISTRATION.BRANCH.CREATE_TITLE')}
      onConfirm={handleSave}
      confirmLabel={t(isEdit ? 'COMMON.SAVE' : 'ADMINISTRATION.BRANCH.CREATE_CONFIRM')}
      loading={saving}
      disableBackdropClose
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}

        {branch ? (
          <>
            <CommonTextField id="branch-state" label={t('ADMINISTRATION.BRANCH.STATE')} value={branch.stateName || NONE} disabled />
            <CommonTextField
              id="branch-district"
              label={t('ADMINISTRATION.BRANCH.DISTRICT')}
              value={branch.districtName || NONE}
              disabled
            />
          </>
        ) : (
          <>
            <CommonSelect
              id="branch-state"
              label={t('ADMINISTRATION.BRANCH.STATE')}
              required
              placeholder={t('ADMINISTRATION.BRANCH.SELECT_STATE')}
              value={form.stateValue}
              onChange={(value) => update({ stateValue: value, districtValue: '' })}
              options={toOptions(states)}
              error={Boolean(errors.stateValue)}
              helperText={errorText('stateValue')}
            />
            <CommonSelect
              id="branch-district"
              label={t('ADMINISTRATION.BRANCH.DISTRICT')}
              required
              placeholder={t('ADMINISTRATION.BRANCH.SELECT_DISTRICT')}
              value={form.districtValue}
              onChange={(value) => update({ districtValue: value })}
              options={toOptions(districts)}
              disabled={!form.stateValue}
              error={Boolean(errors.districtValue)}
              helperText={errorText('districtValue')}
            />
          </>
        )}

        <CommonTextField
          id="branch-code"
          label={t('ADMINISTRATION.BRANCH.CODE')}
          required={!isEdit}
          disabled={isEdit}
          value={isEdit ? branch?.code || NONE : form.code}
          onChange={(e) => update({ code: e.target.value })}
          error={Boolean(errors.code)}
          helperText={errorText('code')}
          hint={isEdit ? undefined : t('ADMINISTRATION.BRANCH.CODE_HINT')}
          inputProps={{ maxLength: 20 }}
        />
        <CommonTextField
          id="branch-name"
          label={t('ADMINISTRATION.BRANCH.NAME')}
          required
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          error={Boolean(errors.name)}
          helperText={errorText('name')}
          inputProps={{ maxLength: BRANCH_NAME_MAX }}
        />
      </Box>
    </CommonDialog>
  );
};

export default BranchFormDialog;
