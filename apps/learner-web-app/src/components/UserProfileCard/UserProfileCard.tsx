'use client';

import {
  Box,
  Typography,
  Grid,
  Divider,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  IconButton,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import { useEffect, useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import settingImage from '../../../public/images/settings.png';
import Image from 'next/image';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useRouter } from 'next/navigation';
import { getUserDetails } from '@learner/utils/API/userService';
import { Loader, useTranslation } from '@shared-lib';
import { isUnderEighteen, toPascalCase } from '@learner/utils/helper';
import { isUndefined } from 'lodash';

// Assuming an API function fetchUserData is available
// Example: const fetchUserData = async () => { ... };

const getCustomFieldValue = (customFields: any, label: string) => {
  console.log(customFields);
  const field = customFields.find((f: any) => f.label === label);
  return field?.selectedValues?.[0]?.value || field?.selectedValues?.[0] || '-';
};
const getCustomField = (customFields: any, label: string) => {
  console.log(customFields);
  const field = customFields.find((f: any) => f.label === label);
  return field?.selectedValues?.[0]?.label || field?.selectedValues?.[0] || '-';
};
const UserProfileCard = ({maxWidth= '600px'}) => {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null); // User data state
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
const storedConfig = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('uiConfig') || '{}')
  : {};


  const options = [
   // t('LEARNER_APP.USER_PROFILE_CARD.EDIT_PROFILE'),
    // t('LEARNER_APP.USER_PROFILE_CARD.CHANGE_USERNAME'),
    t('LEARNER_APP.USER_PROFILE_CARD.CHANGE_PASSWORD'),
    t('LEARNER_APP.USER_PROFILE_CARD.PRIVACY_GUIDELINES'),
    t('LEARNER_APP.USER_PROFILE_CARD.CONSENT_FORM'),
    t('COMMON.FAQS'),
  ];
if(storedConfig?.isEditProfile){
options.push(t('LEARNER_APP.USER_PROFILE_CARD.EDIT_PROFILE'));
}
  const isBelow18 = (dob: string): boolean => {
    const birthDate = new Date(dob);
    const today = new Date();

    const age =
      today.getFullYear() -
      birthDate.getFullYear() -
      (today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
        ? 1
        : 0);

    return age < 18;
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Replace this with actual API call to fetch user data
        const userId = localStorage.getItem('userId');
        if (userId) {
          const useInfo = await getUserDetails(userId, true);
          console.log('useInfo', useInfo?.result?.userData);
          setUserData(useInfo?.result?.userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpen = (option: string) => {
    console.log(option);
    if (option === t('LEARNER_APP.USER_PROFILE_CARD.EDIT_PROFILE')) {
      router.push('/profile-complition');
    }
    if (option === t('LEARNER_APP.USER_PROFILE_CARD.CHANGE_PASSWORD')) {
      router.push('/change-password');
    }
    if (option === 'Change Username') {
      router.push('/change-username');
    }
    if (option === t('LEARNER_APP.USER_PROFILE_CARD.PRIVACY_GUIDELINES')) {
      window.open('https://www.pratham.org/privacy-guidelines/', '_blank');
    } else if (
      option === t('LEARNER_APP.USER_PROFILE_CARD.CONSENT_FORM') &&
      isBelow18(userData.dob)
    ) {
      window.open('/files/consent_form_below_18_hindi.pdf', '_blank');
    } else if (
      option === t('LEARNER_APP.USER_PROFILE_CARD.CONSENT_FORM') &&
      !isBelow18(userData.dob)
    ) {
      window.open('/files/consent_form_above_18_hindi.pdf', '_blank');
    } else if (option === t('COMMON.FAQS')) {
      router.push('/faqs');
    }

    setSelectedOption(option);
    setOpen(true);
    setAnchorEl(null); // Close the menu
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  if (!userData) {
    return (
      <Loader isLoading={true} layoutHeight={0}>
        {/* Your actual content goes here, even if it's an empty div */}
        <div />
      </Loader>
    ); // Show loading while data is being fetched
  }
  console.log(userData);
  const {
    firstName,
    middleName,
    lastName,
    gender,
    dob,
    email,
    mobile,
    username,
    customFields = [],
  } = userData;
  if (typeof window !== 'undefined' && mobile) {
    localStorage.setItem('usermobile', mobile);
  }
  const fullName = [
    toPascalCase(firstName),
    toPascalCase(middleName),
    toPascalCase(lastName),
  ]
    .filter(Boolean)
    .join(' ');
  const maritalStatus = getCustomFieldValue(customFields, 'MARITAL_STATUS');
  const qualification = getCustomField(
    customFields,
    'HIGHEST_EDCATIONAL_QUALIFICATION_OR_LAST_PASSED_GRADE'
  );
  const phoneOwnership = getCustomFieldValue(
    customFields,
    'DOES_THIS_PHONE_BELONG_TO_YOU'
  );
  const priorTraining = getCustomFieldValue(
    customFields,
    'HAVE_YOU_RECEIVE_ANY_PRIOR_TRAINING'
  );
  const currentWork = getCustomFieldValue(
    customFields,
    'ARE_YOU_CURRENTLY_WORKING_IF_YES_CHOOSE_THE_DOMAIN'
  );
  const futureWork = getCustomFieldValue(
    customFields,
    'WHAT_DO_YOU_WANT_TO_BECOME'
  );
  const motherName = getCustomFieldValue(customFields, 'MOTHER_NAME');
  const parentPhone = getCustomFieldValue(
    customFields,
    'PARENT_GUARDIAN_PHONE_NO'
  );
  const guardianName = getCustomFieldValue(customFields, 'NAME_OF_GUARDIAN');
  const guarduianRelation = getCustomFieldValue(
    customFields,
    'RELATION_WITH_GUARDIAN'
  );

  const state = getCustomFieldValue(customFields, 'STATE');
  const district = getCustomFieldValue(customFields, 'DISTRICT');
  const block = getCustomFieldValue(customFields, 'BLOCK');

  const village = getCustomFieldValue(customFields, 'VILLAGE');

  const sectionCardStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#78590C',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '4px',
  };

  const valueStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: '#333',
    lineHeight: 1.4,
  };

  return (
    <Paper
      sx={{
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
        maxWidth: maxWidth,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          background: '#F8EFDA',
          padding: '24px',
          position: 'relative',
          color: '#1F1B13',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                backgroundColor: 'rgba(31,27,19,0.1)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1F1B13',
              }}
            >
              {fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                fontWeight="700"
                sx={{ mb: 0.5 }}
              >
                {fullName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                @{username}
              </Typography>
            </Box>
          </Box>
          
          {/* <IconButton 
            onClick={handleSettingsClick}
            sx={{
              color: '#1F1B13',
              backgroundColor: 'rgba(31,27,19,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(31,27,19,0.2)',
              },
            }}
          >
            <Image
              src={settingImage}
              alt="Setting Icon"
              width={20}
              height={20}
            />
          </IconButton> */}
        </Box>

        <Chip
          label={t('LEARNER_APP.USER_PROFILE_CARD.MY_PROFILE')}
          sx={{
            backgroundColor: 'rgba(31,27,19,0.1)',
            color: '#1F1B13',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Content Section */}
      <Box sx={{ padding: '24px', backgroundColor: '#FAFAFA' }}>
        {!isUnderEighteen(dob) ? (
          <>
            <Typography sx={sectionTitleStyle}>
              <ContactPhoneIcon sx={{ fontSize: '1.2rem' }} />
              {t('LEARNER_APP.USER_PROFILE_CARD.CONTACT_INFORMATION')}
            </Typography>
            <Box sx={sectionCardStyle}>
              <Grid container spacing={1.5}>
                {mobile !== '-' && (
                  <Grid item xs={6}>
                    <Typography sx={labelStyle}>
                      {t('LEARNER_APP.USER_PROFILE_CARD.PHONE_NUMBER')}
                    </Typography>
                    <Typography sx={valueStyle}>{mobile}</Typography>
                  </Grid>
                )}
                {phoneOwnership !== '-' && (
                  <Grid item xs={6}>
                    <Typography sx={labelStyle}>
                      {t('LEARNER_APP.USER_PROFILE_CARD.PHONE_BELONGS_TO_YOU')}
                    </Typography>
                    <Typography sx={valueStyle}>
                      {toPascalCase(phoneOwnership)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={sectionTitleStyle}>
              <PersonIcon sx={{ fontSize: '1.2rem' }} />
              {t('LEARNER_APP.USER_PROFILE_CARD.GUARDIAN_DETAILS')}
            </Typography>
            <Box sx={sectionCardStyle}>
              <Grid container spacing={1.5}>
                {parentPhone !== '-' && (
                  <Grid item xs={6}>
                    <Typography sx={labelStyle}>
                      {t('LEARNER_APP.USER_PROFILE_CARD.PARENT_PHONE_NUMBRER')}
                    </Typography>
                    <Typography sx={valueStyle}>{parentPhone}</Typography>
                  </Grid>
                )}
                {guarduianRelation !== '-' && (
                  <Grid item xs={6}>
                    <Typography sx={labelStyle}>
                      {t('LEARNER_APP.USER_PROFILE_CARD.GUARDIAN_RELATION')}
                    </Typography>
                    <Typography sx={valueStyle}>
                      {toPascalCase(guarduianRelation)}
                    </Typography>
                  </Grid>
                )}
                {guardianName !== '-' && (
                  <Grid item xs={6}>
                    <Typography sx={labelStyle}>
                      {t('LEARNER_APP.USER_PROFILE_CARD.GUARDIAN_NAME')}
                    </Typography>
                    <Typography sx={valueStyle}>
                      {toPascalCase(guardianName)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}

    
    
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 250,
          },
        }}
      >
        <MenuItem onClick={() => handleOpen(options[0])}>
          <ListItemText>{options[0]}</ListItemText>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <ChevronRightIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>

        {options.slice(1).map((option) => (
          <MenuItem key={option} onClick={() => handleOpen(option)}>
            <ListItemText>{option}</ListItemText>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <ChevronRightIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default UserProfileCard;