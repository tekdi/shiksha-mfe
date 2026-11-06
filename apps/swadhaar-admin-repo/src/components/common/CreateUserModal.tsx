import React, { useState, useEffect, useRef } from 'react';
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
  SWADHAAR_FIELD_IDS,
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
const STATE_FIELD_ID = SWADHAAR_FIELD_IDS.STATE;
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
  const field = customFields.find((cf) => matches(cf) && readFieldValue(cf));
  return field ? readFieldValue(field) : '';
};

/** `value` may be an array or a string; `selectedValues` carries {id, value} */
const readFieldValue = (cf: any): string => {
  const raw = Array.isArray(cf?.value) ? cf.value[0] : cf?.value;
  if (raw !== undefined && raw !== null && toStr(raw).trim()) return toStr(raw).trim();
  const selected = cf?.selectedValues?.[0];
  return toStr(selected?.id ?? selected?.value).trim();
};

const hasLabelOrName = (cf: any, names: string[]): boolean =>
  names.includes(cf.label?.toLowerCase()) || names.includes(cf.name?.toLowerCase());

/** Builds the form state from a row of the users list (initial prefill). */
const formStateFromInitialData = (initialData: any): FormState => {
  const rawUsername = toStr(initialData.username);
  return {
    fullName: toStr(initialData.fullName || initialData.name),
    username: rawUsername,
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
  const customFields: any[] = user.customFields || user.customField || [];

  const stateVal = findCustomFieldValue(
    customFields,
    (cf) => cf.fieldId === STATE_FIELD_ID || hasLabelOrName(cf, ['state'])
  );
  const districtVal = findCustomFieldValue(
    customFields,
    (cf) => cf.fieldId === SWADHAAR_FIELD_IDS.DISTRICT || hasLabelOrName(cf, ['district'])
  );
  const branchVal = findCustomFieldValue(
    customFields,
    (cf) => cf.fieldId === SWADHAAR_FIELD_IDS.BRANCH || hasLabelOrName(cf, ['branch', 'block'])
  );

  return {
    fullName: computedName || prev.fullName,
    username: uUsername || prev.username,
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

const FULL_NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;

export const validateFullName = (fullName: string, isEdit: boolean) => {
  if (!fullName) return 'USERS.FORM.ERROR_FULL_NAME_REQUIRED';
  if (fullName.length < 2) return 'USERS.FORM.ERROR_FULL_NAME_MIN';
  return FULL_NAME_REGEX.test(fullName) ? undefined : 'USERS.FORM.ERROR_FULL_NAME_INVALID';
};

/** On create the username is the 10-digit mobile number */
const validateUsername = (username: string, isEdit: boolean) => {
  if (isEdit) return undefined;
  if (!username) return 'USERS.FORM.ERROR_USERNAME_REQUIRED';
  return PHONE_REGEX.test(username) ? undefined : 'USERS.FORM.ERROR_USERNAME_INVALID';
};

const validateEmail = (email: string, isEdit: boolean) => {
  if (!email || email === '-') return 'USERS.FORM.ERROR_EMAIL_REQUIRED';
  return !EMAIL_REGEX.test(email)
    ? 'USERS.FORM.ERROR_EMAIL_INVALID'
    : undefined;
};

const validatePhone = (phone: string, isEdit: boolean) => {
  if (!phone || phone === '-') return 'USERS.FORM.ERROR_PHONE_REQUIRED';
  return PHONE_REGEX.test(phone) ? undefined : 'USERS.FORM.ERROR_PHONE_INVALID';
};

const isSuccessfulUpdate = (response: any) =>
  response?.responseCode === 'OK' ||
  response?.responseCode === 200 ||
  Boolean(response?.result) ||
  response?.params?.status === 'successful';

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onClose,
  onSuccess,
  availableRoles = [],
  initialData,
  isEdit = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  // Email the user had when the dialog opened; an unchanged email is not sent on edit
  const originalEmailRef = useRef('');
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
    const initialForm = formStateFromInitialData(initialData);
    originalEmailRef.current = initialForm.email;
    setFormData(initialForm);

    // Call getUserDetailsInfo to fetch complete profile data from server
    const targetUserId = toStr(initialData.userId || initialData.id);
    if (!targetUserId) return;
    getUserDetailsInfo(targetUserId)
      .then((res: any) => {
        const user = res?.result?.userData || res?.userData || res?.result || res;
        if (user) {
          setFormData((prev) => {
            const merged = mergeServerUserIntoForm(prev, user);
            // Only count the server's email as the original while the admin has not edited it
            if (prev.email === originalEmailRef.current) originalEmailRef.current = merged.email;
            return merged;
          });
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
      // On create the username and phone number mirror each other (either can be edited) until they differ
      const linked = prev.username === prev.phone;
      if (!isEdit && linked && field === 'phone') next.username = toStr(value);
      if (!isEdit && linked && field === 'username') next.phone = toStr(value).slice(0, 10);
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

  // Create and edit need every mandatory field filled and valid before the button enables
  // (the username is fixed when editing, so it is not checked there)
  const canCreate =
    !validateFullName(toStr(formData.fullName).trim(), isEdit) &&
    (isEdit || !validateUsername(toStr(formData.username).trim(), false)) &&
    !validateEmail(toStr(formData.email).trim(), isEdit) &&
    !validatePhone(toStr(formData.phone).trim(), isEdit) &&
    formData.gender !== GENDER_NOT_SELECTED &&
    Boolean(formData.role) &&
    !(formData.password && formData.password.length < 8);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    const fullName = toStr(formData.fullName).trim();
    const email = toStr(formData.email).trim();
    const phone = toStr(formData.phone).trim();
    const password = toStr(formData.password);

    // The same fields are mandatory when creating and editing (the username is fixed when editing)
    const fieldErrors: Partial<Record<keyof FormState, string | undefined>> = {
      fullName: validateFullName(fullName, isEdit),
      username: validateUsername(toStr(formData.username).trim(), isEdit),
      email: validateEmail(email, isEdit),
      phone: validatePhone(phone, isEdit),
      role: !formData.role ? 'USERS.FORM.ERROR_ROLE_REQUIRED' : undefined,
      gender:
        formData.gender === GENDER_NOT_SELECTED
          ? 'USERS.FORM.ERROR_GENDER_REQUIRED'
          : undefined,
      password:
        !isEdit && password && password.length < 8
          ? 'USERS.FORM.ERROR_PASSWORD_MIN'
          : undefined,
    };
    (Object.keys(fieldErrors) as (keyof FormState)[]).forEach((key) => {
      const message = fieldErrors[key];
      if (message) newErrors[key] = message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitEdit = async (inputFields: UserInputFields) => {
    const targetUserId = toStr(initialData?.userId || initialData?.id);
    if (!targetUserId) {
      showToastMessage(t('USERS.FORM.USER_ID_MISSING'), 'error');
      return;
    }

    const emailChanged = formData.email.trim() !== originalEmailRef.current.trim();
    const updatePayload = buildUpdateUserPayload({
      ...inputFields,
      email: emailChanged ? inputFields.email : undefined,
    });
    const response = await updateUserAccount(targetUserId, updatePayload);

    if (isSuccessfulUpdate(response)) {
      showToastMessage(response?.params?.successmessage || t('USERS.FORM.UPDATE_SUCCESS'), 'success');
      onSuccess?.();
      onClose();
    } else {
      showToastMessage(
        response?.params?.errmsg || response?.message || t('USERS.FORM.UPDATE_FAILED'),
        'error'
      );
    }
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
        await submitEdit(inputFields);
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
          <CommonButton variant="dark" onClick={handleSubmit} loading={loading} disabled={!canCreate}>
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

            {/* Username (optional on create, falls back to the phone number; read-only when editing) */}
            <Grid item xs={12} sm={6}>
              <CommonTextField
                label={t('USERS.FORM.USERNAME')}
                required={!isEdit}
                value={formData.username}
                onChange={(e) => handleChange('username', isEdit ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 10))}
                error={Boolean(errors.username)}
                helperText={errorText('username')}
                hint={isEdit ? undefined : t('USERS.FORM.USERNAME_HINT')}
                disabled={isEdit}
              />
            </Grid>

            {/* Employee ID (optional) */}
            {/* {isEdit && (
              <Grid item xs={12} sm={6}>
                <CommonTextField
                  label={t('USERS.FORM.EMPLOYEE_ID')}
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  hint={t('USERS.FORM.EMPLOYEE_ID_HINT')}
                />
              </Grid>
            )} */}

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
                hint={t('USERS.FORM.EMAIL_HINT') || undefined}
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
                required
                error={Boolean(errors.gender)}
                helperText={errorText('gender')}
                value={formData.gender}
                onChange={(value) => handleChange('gender', value)}
                options={GENDER_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
              />
            </Grid>

            {/* Password (optional, create only; a temporary one is generated when blank) */}
            {/* {!isEdit && ( */}
            {/* <Grid item xs={12} sm={6}>
              <CommonTextField
                label={t('USERS.FORM.PASSWORD')}
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={Boolean(errors.password)}
                helperText={errorText('password')}
                hint={t('USERS.FORM.PASSWORD_HINT')}
              />
            </Grid> */}
            {/* )} */}
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
          </Grid>
        </Box>

        {/* 3. ROLE (the option value is the role id that user/v1/create expects) */}
        <Box>
          <Typography sx={SECTION_TITLE_SX}>{t('USERS.FORM.SECTION_ROLE')}</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <CommonSelect
                label={t('USERS.FORM.ROLE')}
                required
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
      </Box>
    </CommonDialog>
  );
};

export default CreateUserModal;
