'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress,
  Dialog, DialogContent, Select, MenuItem, FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { KeyboardArrowDown } from '@mui/icons-material';
import ProfileAvatar from '@learner/components/Profile/ProfileAvatar';
import ProfileField from '@learner/components/Profile/ProfileField';
import NameEditField from '@learner/components/Profile/NameEditField';
import { getUserDetails, editEditUser, uploadProfilePhoto } from '@learner/utils/API/services/ProfileService';
import { showToastMessage } from '@learner/components/ToastComponent/Toastify';
import { useTranslation } from '@shared-lib';
import { LANGUAGE_OPTIONS, LanguageCode } from '@learner/utils/constants/language';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface SwadhaarDesktopEditProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful save so parent can refresh displayed name/avatar */
  onProfileUpdated?: () => void;
}

const SwadhaarDesktopEditProfileModal: React.FC<SwadhaarDesktopEditProfileModalProps> = ({
  open,
  onClose,
  onProfileUpdated,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Fetch profile when modal opens */
  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await getUserDetails(userId, true);
        if (response?.result?.userData) {
          setProfileData(response.result.userData);
        }
      }
    } catch {
      showToastMessage(t('LEARNER_APP.PROFILE.ERROR_FETCHING'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const capitalize = (str: string) =>
    str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const fullName = capitalize(
    `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim()
  );

  const getCustomFieldValue = (fieldId: string) => {
    const field = profileData?.customFields?.find((f: any) => f.fieldId === fieldId);
    return field ? field.value : '';
  };

  const cflLocation = getCustomFieldValue('cflLocation') || 'CFL Jharkhand - Torpa';
  const joiningDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-GB')
    : '12/03/2026';

  const handleSaveName = async (newName: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const trimmed = newName.trim();
        const parts = trimmed.split(/\s+/);
        const firstName = capitalize(parts[0] || '');
        const lastName = parts.length > 1 ? capitalize(parts.slice(1).join(' ')) : '';
        await editEditUser(userId, { firstName, lastName });
        showToastMessage(t('LEARNER_APP.PROFILE.NAME_UPDATED_SUCCESS'), 'success');
        setIsEditingName(false);
        // Sync localStorage
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('name', firstName);
        fetchProfile();
        onProfileUpdated?.();
      }
    } catch {
      showToastMessage(t('LEARNER_APP.PROFILE.ERROR_UPDATING_NAME'), 'error');
      throw new Error('save failed');
    }
  };

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);

  const handleLanguageChange = (event: any) => {
    const newLang = event.target.value as LanguageCode;
    setSelectedLanguage(newLang);
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage(t('LEARNER_APP.PROFILE.FILE_TOO_LARGE'), 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToastMessage(t('LEARNER_APP.PROFILE.INVALID_FILE_TYPE'), 'error');
      return;
    }
    setUploading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        // uploadProfilePhoto returns the image URL — cache it so the home banner
        // refreshes immediately when onProfileUpdated triggers loadData().
        const imageUrl = await uploadProfilePhoto(userId, file);
        if (imageUrl) {
          localStorage.setItem('profilePicture', imageUrl);
        }
        showToastMessage(t('LEARNER_APP.PROFILE.PHOTO_UPLOADED_SUCCESS'), 'success');
        fetchProfile();
        onProfileUpdated?.();
      }
    } catch {
      showToastMessage(t('LEARNER_APP.PROFILE.ERROR_UPLOADING_PHOTO'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        // Allow closing by clicking backdrop or pressing Escape
       if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Modal header */}
        <Box
          sx={{
            bgcolor: DARK_NAV,
            borderRadius: '16px 16px 0 0',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}
          >
            Edit Profile
          </Typography>
          <Box
            id="swadhaar-edit-profile-close-btn"
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              '&:hover': { color: '#fff' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <CircularProgress sx={{ color: PRIMARY }} />
          </Box>
        ) : (
          <Box sx={{ px: 3, py: 2.5, bgcolor: '#F9FAFB' }}>
            {/* Avatar + Upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
              <ProfileAvatar
                initials={getInitials(fullName)}
                imageUrl={profileData?.name || profileData?.basicDetails?.image || null}
                size={72}
                primaryColor={PRIMARY}
              />
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                variant="contained"
                onClick={handleUploadClick}
                disabled={uploading}
                sx={{
                  mt: 1.5,
                  bgcolor: PRIMARY,
                  color: '#fff',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'none',
                  px: 3,
                  py: 0.75,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#D4762B', boxShadow: 'none' },
                }}
              >
                {uploading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Upload Photo'}
              </Button>
            </Box>

            {/* Form fields (white card) */}
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                px: 2.5,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              {/* Language */}
              {/* <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, color: '#6B7280', mb: 0.5, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  {t('LEARNER_APP.PROFILE.FIELD_LANGUAGE')}
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={language || 'en'}
                    onChange={handleLanguageChange}
                    IconComponent={KeyboardArrowDown}
                    sx={{
                      height: '40px',
                      borderRadius: '8px',
                      fontSize: 13,
                      color: '#1F2937',
                      fontFamily: 'Inter, sans-serif',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
                    }}
                  >
                    {LANGUAGE_OPTIONS.map((option: any) => (
                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: 13 }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box> */}

              {/* Name */}
              {isEditingName ? (
                <NameEditField
                  label={t('LEARNER_APP.PROFILE.FIELD_NAME')}
                  initialValue={fullName}
                  onSave={handleSaveName}
                  onCancel={() => setIsEditingName(false)}
                />
              ) : (
                <ProfileField
                  label={t('LEARNER_APP.PROFILE.FIELD_NAME')}
                  value={fullName}
                  isEditable={true}
                  onEditClick={() => setIsEditingName(true)}
                  readOnly={true}
                />
              )}

              <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_DESIGNATION')} value={profileData?.role || 'Trainer'} />
              <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_CFL_LOCATION')} value={cflLocation} />
              <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_MOBILE')} value={profileData?.mobile || ''} />
              <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_EMAIL')} value={profileData?.email || ''} />
              <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_JOINING_DATE')} value={joiningDate} />
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
              <Button
                id="swadhaar-edit-profile-cancel-btn"
                variant="outlined"
                onClick={onClose}
                fullWidth
                sx={{
                  borderColor: '#E5E7EB',
                  color: '#6B7280',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'none',
                  py: 1,
                  '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' },
                }}
              >
                Cancel
              </Button>
              <Button
                id="swadhaar-edit-profile-save-btn"
                variant="contained"
                onClick={async () => {
                  setSaving(true);
                  try {
                    if (selectedLanguage) {
                      const { updateLanguageInProfile } = await import('@learner/utils/API/userService');
                      await updateLanguageInProfile(selectedLanguage);
                    }
                  } finally {
                    setSaving(false);
                  }
                  if (!isEditingName) onClose();
                }}
                fullWidth
                disabled={saving}
                sx={{
                  bgcolor: PRIMARY,
                  color: '#fff',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: 'none',
                  py: 1,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#D4762B', boxShadow: 'none' },
                }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SwadhaarDesktopEditProfileModal;
