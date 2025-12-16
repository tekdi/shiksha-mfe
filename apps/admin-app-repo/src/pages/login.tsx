import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  TextField,
  Grid,
  Typography,
  useMediaQuery, // Import useMediaQuery hook
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ReactGA from 'react-ga4';
import Checkbox from '@mui/material/Checkbox';
import Image from 'next/image';
import Loader from '../components/Loader';
import MenuItem from '@mui/material/MenuItem';
import appLogo from '../../public/images/appLogo.png';
import config from '../../config.json';
import { getUserId, login } from '../services/LoginService';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';
import { telemetryFactory } from '@/utils/telemetry';
import { logEvent } from '@/utils/googleAnalytics';
import { showToastMessage } from '@/components/Toastify';
import Link from '@mui/material/Link';
import loginImage from '../../public/loginImage.jpg';
import { useUserIdStore } from '@/store/useUserIdStore';
import { getUserDetailsInfo } from '@/services/UserList';
import { Storage, TenantName } from '@/utils/app.constant';
import useSubmittedButtonStore from '@/utils/useSharedState';
import { Role } from '@/utils/app.constant';
import { AcademicYear } from '@/utils/Interfaces';
import { getAcademicYear } from '@/services/AcademicYearService';
import useStore from '@/store/store';
import loginImg from '../../public/images/login-image.jpg';
import TenantService from '@/services/TenantService';
import { transformLabel } from '@/utils/Helper';

const LoginPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(lang);
  const [language, setLanguage] = useState(selectedLanguage);
  const setIsActiveYearSelected = useStore(
    (state: { setIsActiveYearSelected: any }) => state.setIsActiveYearSelected
  );
  console.log(setIsActiveYearSelected + 'snehallltest');
  const theme = useTheme<any>();
  const router = useRouter();
  const { setUserId } = useUserIdStore();
  const setAdminInformation = useSubmittedButtonStore(
    (state: any) => state.setAdminInformation
  );
  // Use useMediaQuery to detect screen size
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const passwordRef = useRef<HTMLInputElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const preferredLang = localStorage.getItem('preferredLanguage') || 'en';
      setLanguage(preferredLang);
      setLang(preferredLang);
      const storedUserData = localStorage.getItem('adminInfo');

      const token = localStorage.getItem('token');
      if (token) {
        const { locale } = router;
        if (locale) {
          let role;
          if (storedUserData) {
            role = JSON.parse(storedUserData);
            if (role?.role === Role.SCTA || role?.role === Role.CCTA) {
              // To do :- hardcoding to be removed
              if (role?.tenantData[0]?.tenantName != 'Second Chance Program') {
                router.push('/workspace');
              } else {
                router.push('/course-planner', undefined, { locale: locale });
              }
            } else if (
              role?.role === Role.CENTRAL_ADMIN &&
              role?.tenantData[0]?.tenantName ==
                TenantName.SECOND_CHANCE_PROGRAM
            ) {
              router.push('/programs', undefined, { locale: locale });
            } else if (
              role?.role === Role.ADMIN &&
              role?.tenantData[0]?.tenantName ==
                TenantName.SECOND_CHANCE_PROGRAM
            ) {
              router.push('/centers', undefined, { locale: locale });
            } else if (
              role?.role === Role.ADMIN &&
              role?.tenantData[0]?.tenantName == TenantName.YOUTHNET
            ) {
              router.push('/mentor');
            }
          }
        } else {
          let role;
          if (storedUserData) {
            role = JSON.parse(storedUserData);
            if (role?.role === Role.SCTA || role?.role === Role.CCTA) {
              router.push('/course-planner');
            }
            if (
              role?.role === Role.CENTRAL_ADMIN &&
              role?.tenantData[0]?.tenantName ==
                TenantName.SECOND_CHANCE_PROGRAM
            ) {
              router.push('/programs');
            } else if (
              role?.role === Role.ADMIN &&
              role?.tenantData[0]?.tenantName ==
                TenantName.SECOND_CHANCE_PROGRAM
            ) {
              router.push('/centers');
            } else if (
              (role?.role === Role.CENTRAL_ADMIN ||
                role?.role === Role.ADMIN) &&
              role?.tenantData[0]?.tenantName == TenantName.YOUTHNET
            ) {
              router.push('/mentor');
            }
          }
        }
      }
    }
  }, []);

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const trimmedValue = value.trim();
    setUsername(trimmedValue);
    setUsernameError(/\s/.test(trimmedValue));
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPassword(value);
  };

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
    logEvent({
      action: 'show-password-icon-clicked',
      category: 'Login Page',
      label: 'Show Password',
    });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const fetchUserDetail = async () => {
    let userId;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        userId = localStorage.getItem(Storage.USER_ID);
      }
      const fieldValue = true;
      if (userId) {
        const response = await getUserDetailsInfo(userId, fieldValue);

        const userInfo = response?.userData;
        //set user info in zustand store
        if (typeof window !== 'undefined' && window.localStorage) {
          if (userInfo) {
            if (userInfo?.customFields) {
              const boardField = userInfo.customFields.find(
                (field: any) => field.label === 'BOARD'
              );

              const boardValues = boardField?.selectedValues || [];

              if (boardValues.length > 0) {
                console.log(boardValues);
                localStorage.setItem(
                  'userSpecificBoard',
                  JSON.stringify(boardValues)
                );
              } else {
                console.log(
                  'No BOARD field found in customFields. Skipping localStorage update.'
                );
              }
            }

            localStorage.setItem('adminInfo', JSON.stringify(userInfo));
            const roleId = userInfo.tenantData?.[0]?.roleId || '';
            const roleName = userInfo.tenantData?.[0]?.roleName || '';
            const program = userInfo.tenantData?.[0]?.tenantName || '';

            localStorage.setItem('roleId', roleId);
            localStorage.setItem('roleName', roleName);
            localStorage.setItem('program', program);
          }
          const selectedStateName = transformLabel(
            userInfo?.customFields?.find(
              (field: { label: string }) => field?.label === 'STATE'
            )?.selectedValues?.[0]?.value
          );
          if (selectedStateName) {
            localStorage.setItem('stateName', selectedStateName);
          }
          const selectedStateId = userInfo?.customFields?.find(
            (field: { label: string }) => field?.label === 'STATE'
          )?.selectedValues?.[0]?.id;
          if (selectedStateId) {
            localStorage.setItem('stateId', selectedStateId);
          }
        }
        // if (
        //   userInfo?.role !== Role.ADMIN &&
        //   userInfo?.role !== Role.CENTRAL_ADMIN &&
        //   userInfo?.role !== Role.SCTA &&
        //   userInfo?.role !== Role.CCTA
        // ) {
        //   // const errorMessage = t("LOGIN_PAGE.YOU_DONT_HAVE_APPROPRIATE_PRIVILEGES_TO_ACCESS");
        //   // showToastMessage(errorMessage, "error");
        //   //localStorage.removeItem("token");
        //   localStorage.setItem('previousPage', 'login');
        //   router.push({
        //     pathname: '/unauthorized',
        //     query: { role: userInfo?.role }, // Pass your query parameters here
        //   });
        // } else {
        setAdminInformation(userInfo);
        const getAcademicYearList = async () => {
          const academicYearList: AcademicYear[] = await getAcademicYear();
          if (academicYearList) {
            localStorage.setItem(
              'academicYearList',
              JSON.stringify(academicYearList)
            );
            const extractedAcademicYears = academicYearList?.map(
              ({ id, session, isActive }) => ({ id, session, isActive })
            );
            const activeSession = extractedAcademicYears?.find(
              (item) => item.isActive
            );
            const activeSessionId = activeSession ? activeSession.id : '';
            localStorage.setItem('academicYearId', activeSessionId);
            if (activeSessionId) {
              setIsActiveYearSelected(true);
              // router.push("/centers");
              if (
                userInfo?.role === Role.SCTA ||
                userInfo?.role === Role.CCTA
              ) {
                const { locale } = router;
                // To do :- hardcoding to be removed
                if (
                  userInfo?.tenantData[0]?.tenantName !=
                  TenantName.SECOND_CHANCE_PROGRAM
                ) {
                  window.location.href = '/workspace';
                  router.push('/workspace');
                } else {
                  window.location.href = '/course-planner';
                  if (locale) {
                    router.push('/course-planner', undefined, {
                      locale: locale,
                    });
                  } else router.push('/course-planner');
                }
              } else {
                //window.location.href = "/centers";
                const { locale } = router;
                if (locale) {
                  if (
                    userInfo?.role === Role.CENTRAL_ADMIN &&
                    userInfo?.tenantData[0]?.tenantName ==
                      TenantName.SECOND_CHANCE_PROGRAM
                  ) {
                    window.location.href = '/programs';
                    router.push('/programs', undefined, { locale: locale });
                  } else if (
                    userInfo?.role === Role.ADMIN &&
                    userInfo?.tenantData[0]?.tenantName ==
                      TenantName.SECOND_CHANCE_PROGRAM
                  ) {
                    window.location.href = '/centers';
                    router.push('/centers', undefined, { locale: locale });
                  } else if (
                    userInfo?.role === Role.ADMIN ||
                    (Role.CENTRAL_ADMIN &&
                      userInfo?.tenantData[0]?.tenantName ==
                        TenantName.YOUTHNET)
                  ) {
                    window.location.href = '/mentor';
                    router.push('/mentor', undefined, { locale: locale });
                  }
                } else {
                  if (
                    userInfo?.role === Role.CENTRAL_ADMIN &&
                    userInfo?.tenantData[0]?.tenantName ==
                      TenantName.SECOND_CHANCE_PROGRAM
                  ) {
                    window.location.href = '/programs';
                    router.push('/programs');
                  } else if (
                    userInfo?.role === Role.ADMIN &&
                    userInfo?.tenantData[0]?.tenantName ==
                      TenantName.SECOND_CHANCE_PROGRAM
                  ) {
                    window.location.href = '/centers';
                    router.push('/centers');
                  } else if (
                    userInfo?.role === Role.ADMIN &&
                    userInfo?.tenantData[0]?.tenantName == TenantName.YOUTHNET
                  ) {
                    window.location.href = '/mentor';
                    router.push('/mentor');
                  }
                }
              }
            }
          }
        };
        getAcademicYearList();
        //}
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, []);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    logEvent({
      action: 'login-button-clicked',
      category: 'Login Page',
      label: 'Login Button Clicked',
    });
    if (!usernameError && !passwordError) {
      setLoading(true);
      try {
        const response = await login({ username, password });
        if (response?.result?.access_token) {
          if (typeof window !== 'undefined' && window.localStorage) {
            const token = response.result.access_token;
            const refreshToken = response?.result?.refresh_token;
            localStorage.setItem('token', token);
            rememberMe
              ? localStorage.setItem('refreshToken', refreshToken)
              : localStorage.removeItem('refreshToken');

            const userResponse = await getUserId();

            if (userResponse) {
              localStorage.setItem('userId', userResponse?.userId);
              console.log(userResponse?.tenantData);
              localStorage.setItem(
                'templtateId',
                userResponse?.tenantData?.[0]?.templateId
              );

              localStorage.setItem('userIdName', userResponse?.username);
              // Update Zustand store
              setUserId(userResponse?.userId || '');

              if (userResponse?.userId) {
                document.cookie = `authToken=${token}; path=/; secure; SameSite=Strict`;
                document.cookie = `userId=${userResponse.userId}; path=/; secure; SameSite=Strict`;
              }

              localStorage.setItem('name', userResponse?.firstName);
              localStorage.setItem(
                Storage.USER_DATA,
                JSON.stringify(userResponse)
              );
              const tenantId = userResponse?.tenantData?.[0]?.tenantId;
              const frameworkId =
                userResponse?.tenantData?.[0]?.collectionFramework;
              const channel = userResponse?.tenantData?.[0]?.channelId;
              TenantService.setTenantId(tenantId);
              localStorage.setItem('collectionFramework', frameworkId);
              localStorage.setItem('channelId', channel);
              localStorage.setItem('tenantId', tenantId);
            }

            await fetchUserDetail();
          }
        } else {
          showToastMessage(
            t('LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT'),
            'error'
          );
        }
        setLoading(false);
        const telemetryInteract = {
          context: { env: 'sign-in', cdata: [] },
          edata: {
            id: 'login-success',
            type: 'CLICK',
            pageid: 'sign-in',
            uid: localStorage.getItem('userId') || 'Anonymous',
          },
        };
        telemetryFactory.interact(telemetryInteract);
      } catch (error: any) {
        setLoading(false);
        const errorMessage = t('LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT');
        showToastMessage(errorMessage, 'error');
      }
    }
  };

  const isButtonDisabled =
    !username || !password || usernameError || passwordError;

  const handleChange = (event: SelectChangeEvent) => {
    const newLocale = event.target.value;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('preferredLanguage', newLocale);
      setLanguage(newLocale);
      ReactGA.event('select-language-login-page', {
        selectedLanguage: newLocale,
      });
      router.push('/home', undefined, { locale: newLocale });
    }
  };

  const handleForgotPasswordClick = () => {
    logEvent({
      action: 'forgot-password-link-clicked',
      category: 'Login Page',
      label: 'Forgot Password Link Clicked',
    });
  };

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        bgcolor={theme.palette.warning.A200}
        borderRadius={'10px'}
        sx={{
          '@media (min-width: 900px)': {
            display: 'none',
          },
        }}
      >
        {loading && (
          <Loader showBackdrop={true} loadingText={t('COMMON.LOADING')} />
        )}
        <Box
          display={'flex'}
          overflow="auto"
          alignItems={'center'}
          justifyContent={'center'}
          zIndex={99}
          sx={{ margin: '5px 10px 25px' }}
        >
          <Box
            sx={{ width: '55%', '@media (max-width: 400px)': { width: '95%' } }}
          >
            <Image
              src={appLogo}
              alt="App Logo"
              height={80}
              layout="responsive"
            />
          </Box>
        </Box>
      </Box>
      <Grid
        container
        spacing={2}
        justifyContent={'center'}
        px={'30px'}
        alignItems={'center'}
        width={'100% !important'}
      >
        {!(isMobile || isMedium) && ( // Render only on desktop view
          <Grid
            sx={{
              '@media (max-width: 900px)': {
                display: 'none',
              },
            }}
            item
            xs={12}
            sm={12}
            md={6}
          >
            <Image
              className="login-img"
              src={loginImg}
              alt="Login Image"
              layout="responsive"
            />
          </Grid>
        )}
        <Grid item xs={12} md={6} display="flex" alignItems="center">
          <Box
            flexGrow={1}
            // display={'flex'}
            bgcolor={theme.palette.warning['A400']}
            height="auto"
            zIndex={99}
            justifyContent={'center'}
            p={'2rem'}
            borderRadius={'2rem 2rem 0 0'}
            sx={{
              '@media (min-width: 900px)': {
                width: '100%',
                borderRadius: '16px',
                boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                marginTop: '50px',
              },
              '@media (max-width: 900px)': {
                marginTop: '-25px',
              },
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              bgcolor={theme.palette.warning.A200}
              borderRadius={'10px'}
              sx={{
                '@media (max-width: 900px)': {
                  display: 'none',
                },
              }}
            >
              {loading && (
                <Loader showBackdrop={true} loadingText={t('COMMON.LOADING')} />
              )}
              <Box
                display={'flex'}
                overflow="auto"
                alignItems={'center'}
                justifyContent={'center'}
                zIndex={99}
                // sx={{ margin: '5px 10px 25px', }}
              >
                <Box
                  sx={{
                    width: '60%',
                    '@media (max-width: 700px)': { width: '95%' },
                  }}
                >
                  <Image
                    src={appLogo}
                    alt="App Logo"
                    height={80}
                    layout="responsive"
                  />
                </Box>
              </Box>
            </Box>
            <form onSubmit={handleFormSubmit}>
              {/* <Typography
              variant="h4"
              gutterBottom
              textAlign="center"
              sx={{ mt: 2 }}
            >
              {t("LOGIN_PAGE.LOGIN")}
            </Typography> */}
              <FormControl fullWidth margin="normal">
                <Select
                  className="SelectLanguages"
                  value={language}
                  onChange={handleChange}
                  displayEmpty
                  sx={{
                    borderRadius: '0.5rem',
                    color: theme.palette.warning.A200,
                    width: '117px',
                    height: '32px',
                    marginBottom: '0rem',
                    fontSize: '14px',
                  }}
                >
                  {config.languages.map((lang) => (
                    <MenuItem value={lang.code} key={lang.code}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                id="username"
                InputLabelProps={{ shrink: true }}
                label={t('LOGIN_PAGE.USERNAME')}
                placeholder={t('LOGIN_PAGE.USERNAME_PLACEHOLDER')}
                value={username}
                onChange={handleUsernameChange}
                error={usernameError}
                margin="normal"
              />
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                id="password"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                label={t('LOGIN_PAGE.PASSWORD')}
                placeholder={t('LOGIN_PAGE.PASSWORD_PLACEHOLDER')}
                value={password}
                onChange={handlePasswordChange}
                error={passwordError}
                margin="normal"
                inputRef={passwordRef}
              />

              <Box
                sx={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.palette.secondary.main,
                  mt: 1,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  window.open(
                    `${process.env.NEXT_PUBLIC_RESET_PASSWORD_URL}?redirectUrl=${window.location.origin}/home`,
                    '_self'
                  );
                }}
              >
                {t('LOGIN_PAGE.FORGOT_PASSWORD')}
              </Box>
              {
                <Box
                  display="flex"
                  alignItems="center"
                  marginTop="1.2rem"
                  className="remember-me-checkbox"
                >
                  <Checkbox
                    onChange={(e) => setRememberMe(e.target.checked)}
                    checked={rememberMe}
                  />
                  <Typography
                    variant="body2"
                    onClick={() => {
                      setRememberMe(!rememberMe);
                      logEvent({
                        action: 'remember-me-button-clicked',
                        category: 'Login Page',
                        label: `Remember Me ${
                          rememberMe ? 'Checked' : 'Unchecked'
                        }`,
                      });
                    }}
                    sx={{
                      cursor: 'pointer',
                      marginTop: '15px',
                      color: theme.palette.warning[300],
                    }}
                  >
                    {t('LOGIN_PAGE.REMEMBER_ME')}
                  </Typography>
                </Box>
              }

              <Box marginTop="2rem" textAlign="center">
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={isButtonDisabled}
                  ref={loginButtonRef}
                >
                  {t('LOGIN_PAGE.LOGIN')}
                </Button>
              </Box>
            </form>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      noLayout: true,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default LoginPage;
