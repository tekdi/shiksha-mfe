import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useTranslation } from 'next-i18next';
import MasterDataService, { LocationOption } from '@/services/MasterDataService';
import { getSessionTenantId } from '@/utils/API/serviceHeaders';
import { createUserAccount, updateUserAccount, getUserDetailsInfo, getTenantRoles, TenantRole } from '@/services/UserService';
import { showToastMessage } from '@/components/Toastify';
import { NEUTRAL } from '@/styles/customTheme';
import CommonButton from './CommonButton';
import CommonDialog from './CommonDialog';
import CommonSelect from './CommonSelect';
import CommonTextField from './CommonTextField';
import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
  UserInputFields,
} from '@/utils/userPayloadBuilder';

export interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  availableRoles?: string[];
  initialData?: any;
  isEdit?: boolean;
}

interface FormState {
  fullName: string;
  username: string;
  password: string;
  employeeId: string;
  email: string;
  phone: string;
  gender: string;
  state: string;
  district: string;
  branch: string;
  program: string;
  role: string;
}

/** Sentinel gender value meaning "not selected" (kept as-is for the submit logic). */
const GENDER_NOT_SELECTED = 'Select';
const STATE_FIELD_ID = '800265b1-9058-482a-94f4-726197e1dfe4';
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const GENDER_OPTIONS: { value: string; labelKey: string }[] = [
  { value: GENDER_NOT_SELECTED, labelKey: 'COMMON.SELECT' },
  { value: 'Male', labelKey: 'USERS.FORM.GENDER_MALE' },
  { value: 'Female', labelKey: 'USERS.FORM.GENDER_FEMALE' },
  { value: 'Other', labelKey: 'COMMON.OTHER' },
];

const initialFormState: FormState = {
  fullName: '',
  username: '',
  password: '',
  employeeId: '',
  email: '',
  phone: '',
  gender: GENDER_NOT_SELECTED,
  state: '',
  district: '',
  branch: '',
  program: '',
  role: '',
};

const toStr = (val: any): string => (val !== null && val !== undefined ? String(val) : '');

const formatGender = (gender?: any) => {
  if (!gender) return GENDER_NOT_SELECTED;
  const g = toStr(gender).trim().toLowerCase();
  if (g === 'male') return 'Male';
  if (g === 'female') return 'Female';
  if (g === 'other') return 'Other';
  return GENDER_NOT_SELECTED;
};

const cleanPlaceholder = (value: any, placeholder: string): string =>
  value && value !== placeholder ? toStr(value) : '';

const phoneFromUsername = (username: string, fallback: string): string =>
  PHONE_REGEX.test(username) ? username : fallback;

const employeeIdFromUsername = (username: string, fallback: string): string =>
  !PHONE_REGEX.test(username) && username ? username : fallback;

const findCustomFieldValue = (customFields: any[], matches: (cf: any) => boolean): string => {
  const field = customFields.find(matches);
  return field?.value?.[0] ? toStr(field.value[0]) : '';
};

const hasLabelOrName = (cf: any, names: string[]): boolean =>
  names.includes(cf.label?.toLowerCase()) || names.includes(cf.name?.toLowerCase());

/** Builds the form state from a row of the users list (initial prefill). */
const formStateFromInitialData = (initialData: any): FormState => {
  const rawUsername = toStr(initialData.username);
  return {
    fullName: toStr(initialData.fullName || initialData.name),
    username: '',
    password: '',
    employeeId: toStr(initialData.employeeId) || employeeIdFromUsername(rawUsername, ''),
    email: cleanPlaceholder(toStr(initialData.email), '-'),
    phone: toStr(initialData.phone || initialData.mobile) || phoneFromUsername(rawUsername, ''),
    gender: formatGender(initialData.gender),
    state: toStr(initialData.state),
    district: toStr(initialData.district),
    branch: cleanPlaceholder(initialData.branch, '[Branch]'),
    program: cleanPlaceholder(initialData.program, '[Program]'),
    role: cleanPlaceholder(initialData.role, '-'),
  };
};

/** Overlays the full server profile on top of the current form state. */
const mergeServerUserIntoForm = (prev: FormState, user: any): FormState => {
  const nameFromParts = [user.firstName, user.middleName, user.lastName].map(toStr).filter(Boolean).join(' ');
  const computedName = toStr(user.name) || nameFromParts || prev.fullName;
  const uEmail = toStr(user.email);
  const uUsername = toStr(user.username);
  const computedPhone = toStr(user.mobile || user.phone) || phoneFromUsername(uUsername, prev.phone);
  const computedEmpId = toStr(user.employeeId) || employeeIdFromUsername(uUsername, prev.employeeId);
  const computedGender = formatGender(user.gender);
  const computedRole = toStr(user.role || user.tenantData?.[0]?.roleName) || prev.role;
  const customFields: any[] = Array.isArray(user.customFields) ? user.customFields : [];

  const stateVal = findCustomFieldValue(
    customFields,
    (cf) => cf.fieldId === STATE_FIELD_ID || hasLabelOrName(cf, ['state'])
  );
  const districtVal = findCustomFieldValue(customFields, (cf) => hasLabelOrName(cf, ['district']));
  const branchVal = findCustomFieldValue(customFields, (cf) => hasLabelOrName(cf, ['branch', 'block']));

  return {
    fullName: computedName || prev.fullName,
    username: prev.username,
    password: prev.password,
    employeeId: computedEmpId || prev.employeeId,
    email: uEmail && uEmail !== '-' ? uEmail : prev.email,
    phone: computedPhone || prev.phone,
    gender: computedGender === GENDER_NOT_SELECTED ? prev.gender : computedGender,
    state: stateVal || prev.state,
    district: districtVal || prev.district,
    branch: branchVal || prev.branch,
    program: toStr(user.program) || prev.program,
    role: computedRole && computedRole !== '-' ? computedRole : prev.role,
  };
};

const SECTION_TITLE_SX = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: NEUTRAL.muted,
  mb: 1.4,
} as const;

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onClose,
  onSuccess,
  availableRoles = [],
  initialData,
  isEdit = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Dynamic location options
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [branches, setBranches] = useState<LocationOption[]>([]);
  const [programs, setPrograms] = useState<LocationOption[]>([]);
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);

  // Load programs from MasterDataService
  useEffect(() => {
    setPrograms(MasterDataService.getPrograms());
  }, []);

  // Roles for the dropdown: names are shown, the role id is the value sent on create
  useEffect(() => {
    if (open) {
      getTenantRoles()
        .then(setTenantRoles)
        .catch(() => setTenantRoles([]));
    }
  }, [open]);

  // Edit mode starts with the role name from the user record; swap it for the matching role id
  useEffect(() => {
    if (!formData.role || tenantRoles.length === 0) return;
    if (tenantRoles.some((r) => r.id === formData.role)) return;
    const match = tenantRoles.find((r) => r.name.toLowerCase() === formData.role.toLowerCase());
    if (match) setFormData((prev) => ({ ...prev, role: match.id }));
  }, [tenantRoles, formData.role]);

  // Fetch states on mount / modal open
  useEffect(() => {
    if (open) {
      MasterDataService.getStates()
        .then((res) => {
          setStates(res);
        })
        .catch((err) => {
          console.error('Failed to fetch states:', err);
        });
    }
  }, [open]);

  // Fetch districts when state changes
  useEffect(() => {
    if (formData.state) {
      MasterDataService.getDistricts(formData.state)
        .then((res) => {
          setDistricts(res);
        })
        .catch((err) => {
          console.error('Failed to fetch districts:', err);
        });
    } else {
      setDistricts([]);
      setBranches([]);
    }
  }, [formData.state]);

  // Fetch branches (blocks) when district changes
  useEffect(() => {
    if (formData.district) {
      MasterDataService.getBlocks(formData.district)
        .then((res) => {
          setBranches(res);
        })
        .catch((err) => {
          console.error('Failed to fetch branches:', err);
        });
    } else {
      setBranches([]);
    }
  }, [formData.district]);

  // Reset or initialize on open
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (!(initialData && isEdit)) {
      setFormData(initialFormState);
      return;
    }
    setFormData(formStateFromInitialData(initialData));

    // Call getUserDetailsInfo to fetch complete profile data from server
    const targetUserId = toStr(initialData.userId || initialData.id);
    if (!targetUserId) return;
    getUserDetailsInfo(targetUserId)
      .then((res: any) => {
        const user = res?.result?.userData || res?.userData || res?.result || res;
        if (user) {
          setFormData((prev) => mergeServerUserIntoForm(prev, user));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch user details for prefill:', err);
      });
  }, [open, initialData, isEdit]);

  // Match state label or value with states list once loaded
  useEffect(() => {
    if (states.length > 0 && formData.state) {
      const match = states.find(
        (s) =>
          s.value === formData.state ||
          s.label.toLowerCase() === formData.state.toLowerCase()
      );
      if (match && match.value !== formData.state) {
        setFormData((prev) => ({ ...prev, state: match.value }));
      }
    }
  }, [states, formData.state]);

  // Match district label or value with districts list once loaded
  useEffect(() => {
    if (districts.length > 0 && formData.district) {
      const match = districts.find(
        (d) =>
          d.value === formData.district ||
          d.label.toLowerCase() === formData.district.toLowerCase()
      );
      if (match && match.value !== formData.district) {
        setFormData((prev) => ({ ...prev, district: match.value }));
      }
    }
  }, [districts, formData.district]);

  // Match branch label or value with branches list once loaded
  useEffect(() => {
    if (branches.length > 0 && formData.branch) {
      const match = branches.find(
        (b) =>
          b.value === formData.branch ||
          b.label.toLowerCase() === formData.branch.toLowerCase()
      );
      if (match && match.value !== formData.branch) {
        setFormData((prev) => ({ ...prev, branch: match.value }));
      }
    }
  }, [branches, formData.branch]);

  const roleOptions = React.useMemo(() => {
    const options = tenantRoles.map((r) => ({ value: r.id, label: r.name }));
    const currentName = (formData.role && formData.role !== '-' ? formData.role : '').trim();
    // Edit mode, before the role ids have loaded: keep the user's current role name visible
    if (currentName && !options.some((o) => o.value === currentName)) {
      options.push({ value: currentName, label: currentName });
    }
    return options;
  }, [tenantRoles, formData.role]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: toStr(value) };
      // Cascade clear child location fields
      if (field === 'state') {
        next.district = '';
        next.branch = '';
      } else if (field === 'district') {
        next.branch = '';
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    const fullName = toStr(formData.fullName).trim();
    const email = toStr(formData.email).trim();
    const phone = toStr(formData.phone).trim();
    const password = toStr(formData.password);

    if (!fullName) {
      newErrors.fullName = 'USERS.FORM.ERROR_FULL_NAME_REQUIRED';
    } else if (fullName.length < 2) {
      newErrors.fullName = 'USERS.FORM.ERROR_FULL_NAME_MIN';
    }

    if (!isEdit && !email) {
      newErrors.email = 'USERS.FORM.ERROR_EMAIL_REQUIRED';
    } else if (
      email &&
      email !== '-' &&
      !EMAIL_REGEX.test(email)
    ) {
      newErrors.email = 'USERS.FORM.ERROR_EMAIL_INVALID';
    }

    if (!phone) {
      newErrors.phone = 'USERS.FORM.ERROR_PHONE_REQUIRED';
    } else if (!PHONE_REGEX.test(phone)) {
      newErrors.phone = 'USERS.FORM.ERROR_PHONE_INVALID';
    }

    if (!isEdit && !formData.role) {
      newErrors.role = 'USERS.FORM.ERROR_ROLE_REQUIRED';
    }

    if (!isEdit && formData.gender === GENDER_NOT_SELECTED) {
      newErrors.gender = 'USERS.FORM.ERROR_GENDER_REQUIRED';
    }

    if (!isEdit && password && password.length < 8) {
      newErrors.password = 'USERS.FORM.ERROR_PASSWORD_MIN';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const inputFields: UserInputFields = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        employeeId: formData.employeeId,
        username: formData.username,
        password: formData.password,
        gender: formData.gender === GENDER_NOT_SELECTED ? undefined : formData.gender,
        role: formData.role || undefined,
        roleName: tenantRoles.find((r) => r.id === formData.role)?.name,
        state: formData.state,
        district: formData.district,
        branch: formData.branch,
        program: formData.program,
      };

      if (isEdit) {
        const targetUserId = toStr(initialData?.userId || initialData?.id);
        if (!targetUserId) {
          showToastMessage(t('USERS.FORM.USER_ID_MISSING'), 'error');
          setLoading(false);
          return;
        }

        const updatePayload = buildUpdateUserPayload(inputFields);
        const response = await updateUserAccount(targetUserId, updatePayload);

        if (
          response?.responseCode === 'OK' ||
          response?.responseCode === 200 ||
          response?.result ||
          response?.params?.status === 'successful'
        ) {
          showToastMessage(
            response?.params?.successmessage || t('USERS.FORM.UPDATE_SUCCESS'),
            'success'
          );
          onSuccess?.();
          onClose();
        } else {
          const errorMsg =
            response?.params?.errmsg ||
            response?.message ||
            t('USERS.FORM.UPDATE_FAILED');
          showToastMessage(errorMsg, 'error');
        }
        return;
      }

      // Create flow
      const payload = buildCreateUserPayload(inputFields, getSessionTenantId());
      const response = await createUserAccount(payload);

      if (
        response?.responseCode === 'OK' ||
        response?.result ||
        response?.params?.status === 'successful'
      ) {
        showToastMessage(t('USERS.FORM.CREATE_SUCCESS'), 'success');
        onSuccess?.();
        onClose();
        setFormData(initialFormState);
      } else {
        const errorMsg =
          response?.params?.errmsg ||
          response?.message ||
          t('USERS.FORM.CREATE_FAILED');
        showToastMessage(errorMsg, 'error');
      }
    } catch (err: any) {
      console.error(isEdit ? 'Update user error:' : 'Create user error:', err);
      const errMsg =
        err?.response?.data?.params?.errmsg ||
        err?.response?.data?.message ||
        err?.message ||
        t(isEdit ? 'USERS.FORM.UPDATE_ERROR' : 'USERS.FORM.CREATE_ERROR');
      showToastMessage(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  /** Translated error message for a field (errors hold i18n keys). */
  const errorText = (field: keyof FormState) => (errors[field] ? t(errors[field] as string) : undefined);

  const districtPlaceholder = formData.state
    ? t('USERS.FORM.SELECT_DISTRICT')
    : t('USERS.FORM.SELECT_STATE_FIRST');
  const branchPlaceholder = formData.district
    ? t('USERS.FORM.SELECT_BRANCH')
    : t('USERS.FORM.SELECT_DISTRICT_FIRST');

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      disableBackdropClose
      showCloseIcon
      dividers
      loading={loading}
      maxWidth="md"
      paperMaxWidth="740px"
      title={isEdit ? t('USERS.FORM.EDIT_TITLE') : t('USERS.FORM.CREATE_TITLE')}
      subtitle={t('COMMON.FIELDS_MANDATORY')}
      actions={
        <>
          <CommonButton variant="outlined" onClick={onClose} disabled={loading}>
            {t('COMMON.CANCEL')}
          </CommonButton>
          <CommonButton variant="dark" onClick={handleSubmit} loading={loading}>
            {isEdit ? t('COMMON.SAVE_CHANGES') : t('USERS.FORM.CREATE_USER')}
          </CommonButton>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
        {/* 1. PERSONAL DETAILS */}
        <Box>
          <Typography sx={SECTION_TITLE_SX}>{t('USERS.FORM.SECTION_PERSONAL')}</Typography>

          <Grid container spacing={2}>
            {/* Full name */}
            <Grid item xs={12} sm={6}>
              <CommonTextField
                label={t('USERS.FORM.FULL_NAME')}
                required
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={Boolean(errors.fullName)}
                helperText={errorText('fullName')}
              />
            </Grid>

            {/* Username (optional, create only; falls back to the phone number) */}
            {!isEdit && (
              <Grid item xs={12} sm={6}>
                <CommonTextField
                  label={t('USERS.FORM.USERNAME')}
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  error={Boolean(errors.username)}
                  helperText={errorText('username')}
                  hint={t('USERS.FORM.USERNAME_HINT')}
                />
              </Grid>
            )}

            {/* Employee ID (optional) */}
            {isEdit && (
              <Grid item xs={12} sm={6}>
                <CommonTextField
                  label={t('USERS.FORM.EMPLOYEE_ID')}
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  hint={t('USERS.FORM.EMPLOYEE_ID_HINT')}
                />
              </Grid>
            )}

            {/* Email address */}
            <Grid item xs={12} sm={6}>
              <CommonTextField
                label={t('USERS.FORM.EMAIL')}
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={Boolean(errors.email)}
                helperText={errorText('email')}
                hint={t('USERS.FORM.EMAIL_HINT')}
              />
            </Grid>

            {/* Phone number */}
            <Grid item xs={12} sm={6}>
              <CommonTextField
                label={t('USERS.FORM.PHONE')}
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                error={Boolean(errors.phone)}
                helperText={errorText('phone')}
                hint={t('USERS.FORM.PHONE_HINT')}
              />
            </Grid>

            {/* Gender */}
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.GENDER')}
                required={!isEdit}
                error={Boolean(errors.gender)}
                helperText={errorText('gender')}
                value={formData.gender}
                onChange={(value) => handleChange('gender', value)}
                options={GENDER_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
              />
            </Grid>

            {/* Password (optional, create only; a temporary one is generated when blank) */}
            {!isEdit && (
              <Grid item xs={12} sm={6}>
                <CommonTextField
                  label={t('USERS.FORM.PASSWORD')}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={Boolean(errors.password)}
                  helperText={errorText('password')}
                  hint={t('USERS.FORM.PASSWORD_HINT')}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* 2. LOCATION AND PROGRAM */}
        <Box>
          <Typography sx={SECTION_TITLE_SX}>{t('USERS.FORM.SECTION_LOCATION')}</Typography>

          <Grid container spacing={2}>
            {/* State */}
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.STATE')}
                value={formData.state}
                placeholder={t('USERS.FORM.SELECT_STATE')}
                error={Boolean(errors.state)}
                helperText={errorText('state')}
                onChange={(value) => handleChange('state', value)}
                options={states.map((s) => ({ value: s.value, label: s.label }))}
              />
            </Grid>

            {/* District */}
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.DISTRICT')}
                value={formData.district}
                placeholder={districtPlaceholder}
                disabled={!formData.state}
                onChange={(value) => handleChange('district', value)}
                options={districts.map((d) => ({ value: d.value, label: d.label }))}
              />
            </Grid>

            {/* Branch (Block) */}
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.BRANCH')}
                value={formData.branch}
                placeholder={branchPlaceholder}
                disabled={!formData.district}
                onChange={(value) => handleChange('branch', value)}
                options={branches.map((b) => ({ value: b.value, label: b.label }))}
              />
            </Grid>

            {/* Program */}
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.PROGRAM')}
                value={formData.program}
                placeholder={t('USERS.FORM.SELECT_PROGRAM')}
                onChange={(value) => handleChange('program', value)}
                options={programs.map((p) => ({ value: p.value, label: p.label }))}
              />
            </Grid>
          </Grid>
        </Box>

        {/* 3. ROLE (the option value is the role id that user/v1/create expects) */}
        <Box>
          <Typography sx={SECTION_TITLE_SX}>{t('USERS.FORM.SECTION_ROLE')}</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.ROLE')}
                value={formData.role}
                placeholder={t('USERS.FORM.SELECT_ROLE')}
                error={Boolean(errors.role)}
                helperText={errorText('role')}
                onChange={(value) => handleChange('role', value)}
                options={roleOptions}
              />
              <Typography sx={{ fontSize: '12px', color: NEUTRAL.muted, mt: 0.5, lineHeight: 1.4 }}>
                {t('USERS.FORM.ROLE_HINT')}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Information Banner */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            padding: '12px 16px',
            backgroundColor: NEUTRAL.hover,
            borderRadius: '8px',
            mt: 0.5,
          }}
        >
          <Typography sx={{ fontSize: '13px', lineHeight: 1.5, color: NEUTRAL.ink }}>
            {t('USERS.FORM.CREDENTIALS_INFO')}
          </Typography>
        </Box>
      </Box>
    </CommonDialog>
  );
};

export default CreateUserModal;
