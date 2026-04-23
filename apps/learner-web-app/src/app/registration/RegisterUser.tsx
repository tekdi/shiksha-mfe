'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import Header from '@learner/components/Header/Header';
import dynamic from 'next/dynamic';
import { userCheck } from '@learner/utils/API/userService';
import AccountExistsCard from '@learner/components/AccountExistsCard/AccountExistsCard';
import SimpleModal from '@learner/components/SimpleModal/SimpleModal';
import OtpVerificationComponent from '@learner/components/OtpVerificationComponent/OtpVerificationComponent';
import { sendOTP, verifyOTP } from '@learner/utils/API/OtPService';
import { showToastMessage } from '@learner/components/ToastComponent/Toastify';
import axios from 'axios';
import MobileVerificationSuccess from '@learner/components/MobileVerificationSuccess/MobileVerificationSuccess';
import CreateAccountForm from '@learner/components/CreateAccountForm/CreateAccountForm';
import DynamicForm from '@shared-lib-v2/DynamicForm/components/DynamicForm';
import { fetchForm } from '@shared-lib-v2/DynamicForm/components/DynamicFormCallback';
import { FormContext } from '@shared-lib-v2/DynamicForm/components/DynamicFormConstant';
import { useRouter } from 'next/navigation';
import { createUser } from '@shared-lib-v2/DynamicForm/services/CreateUserService';
import { RoleId } from '@shared-lib-v2/DynamicForm/utils/app.constant';
import { getUserId, login } from '@learner/utils/API/LoginService';
import SignupSuccess from '@learner/components/SignupSuccess /SignupSuccess ';
import { Loader } from '@shared-lib';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useTranslation } from '@shared-lib';
import {
  firstLetterInUpperCase,
  isUnderEighteen,
  maskMobileNumber,
} from '@learner/utils/helper';
import face from '../../../public/images/Group 3.png';

//build issue fix for  ⨯ useSearchParams() should be wrapped in a suspense boundary at page
import { useSearchParams } from 'next/navigation';
import { getTenantInfo } from '@learner/utils/API/ProgramService';
import Image from 'next/image';

type UserAccount = {
  name: string;
  username: string;
};
const RegisterUser = () => {
  const searchParams = useSearchParams();
  const newAccount = searchParams.get('newAccount');
  const tenantId = searchParams.get('tenantId');
  const { t } = useTranslation();

  // let formData: any = {};
  const [usernames, setUsernames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidLinkModal, setInvalidLinkModal] = useState(false);

  const [accountExistModal, setAccountExistModal] = useState<boolean>(false);
  const [usernamePasswordForm, setUsernamePasswordForm] =
    useState<boolean>(false);

  const [otpmodal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [hash, setHash] = useState<string>('');
  const localFormData =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('formData') || '{}')
      : {};

  const [formData, setFormData] = useState<any>(localFormData);

  const localPayload =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('localPayload') || '{}')
      : {};

  const [payload, setPayload] = useState<any>(localPayload);

  const [verificationSuccessModal, setVerificationSuccessModal] =
    useState(false);
  const [signupSuccessModal, setSignupSuccessModal] = useState(false);

  //formData.email = 'a@tekditechnologies.com';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [tenantName, setTenantName] = useState('');

  const router = useRouter();

  const [confirmPassword, setConfirmPassword] = useState('');
  const [addSchema, setAddSchema] = useState(null);
  const [addUiSchema, setAddUiSchema] = useState(null);

  // const [schema, setSchema] = useState(facilitatorSearchSchema);
  // const [uiSchema, setUiSchema] = useState(facilitatorSearchUISchema);
  function checkTenantId(tenantIdToCheck: any, tenantData: any) {
    const name = tenantData?.find(
      (item: any) => item.tenantId === tenantIdToCheck
    ).name;
    setTenantName(name);
    return tenantData?.some((item: any) => item.tenantId === tenantIdToCheck);
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getTenantInfo();
        console.log('res', res?.result);

        const isPresent = checkTenantId(tenantId, res?.result);
        console.log('isPresent', isPresent);
        if (!isPresent) {
          setInvalidLinkModal(true);
        }
      } catch (error) {}
    };
    fetchData();
  }, [tenantId]);
  useEffect(() => {
    // Fetch form schema from API and set it in state.
    const fetchData = async () => {
      try {
        setLoading(true);
        const responseForm: any = await fetchForm([
          {
            fetchUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/form/read?context=${FormContext.learner.context}&contextType=${FormContext.learner.contextType}`,
            header: {},
          },
          // {
          //   fetchUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/form/read?context=${FormContext.learner.context}&contextType=${FormContext.learner.contextType}`,
          //   header: {
          //     tenantid: localStorage.getItem('tenantId'),
          //   },
          // },
        ]);
        console.log('responseForm', responseForm?.schema);
        delete responseForm?.schema?.properties.password;
        delete responseForm?.schema?.properties.confirm_password;
        delete responseForm?.schema?.properties.username;
        delete responseForm?.schema?.properties.program;
        delete responseForm?.schema?.properties.batch;
        delete responseForm?.schema?.properties.center;
        responseForm?.schema?.required.pop('batch');
        //unit name is missing from required so handled from frotnend
        let alterSchema = responseForm?.schema;
        let requiredArray = alterSchema?.required;
        const mustRequired = [
          'firstName',
          'lastName',
          // 'email',
          // 'mobile',
          'dob',
          'gender',
          'state',
          'district',
          'block',
          'village',
          // 'center',
          // 'batch',
          // 'username',
        ];
        // Merge only missing items from required2 into required1
        mustRequired.forEach((item) => {
          if (!requiredArray.includes(item)) {
            requiredArray.push(item);
          }
        });
        //no required

        alterSchema.required = requiredArray;
        //add max selection custom
        if (alterSchema?.properties?.state) {
          alterSchema.properties.state.maxSelection = 1;
        }
        if (alterSchema?.properties?.district) {
          alterSchema.properties.district.maxSelection = 1;
        }
        if (alterSchema?.properties?.block) {
          alterSchema.properties.block.maxSelection = 1;
        }
        if (alterSchema?.properties?.village) {
          alterSchema.properties.village.maxSelection = 1;
        }
        if (alterSchema?.properties?.center) {
          alterSchema.properties.center.maxSelection = 1;
        }
        if (alterSchema?.properties?.batch) {
          alterSchema.properties.batch.maxSelection = 1;
        }

        //alter UI schema
        let alterUISchema = responseForm?.uiSchema;

        //set 2 grid layout
        alterUISchema = enhanceUiSchemaWithGrid(alterUISchema);

        // Usage:
        const updatedUiSchema = reorderUiSchema(alterUISchema, 'mobile', 'dob');

        setAddSchema(alterSchema);
        setAddUiSchema(updatedUiSchema);
      } catch (error) {
        console.log('error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enhanceUiSchemaWithGrid = (uiSchema: any): any => {
    const enhancedSchema = { ...uiSchema };

    Object.keys(enhancedSchema).forEach((fieldKey) => {
      if (typeof enhancedSchema[fieldKey] === 'object') {
        // Ensure ui:options exists
        if (!enhancedSchema[fieldKey]['ui:options']) {
          enhancedSchema[fieldKey]['ui:options'] = {};
        }

        // Push grid option
        enhancedSchema[fieldKey]['ui:options'].grid = { xs: 12, sm: 12, md: 6 };
      }
    });

    return enhancedSchema;
  };

  function reorderUiSchema(uiSchema: any, moveField: any, afterField: any) {
    const order = [...uiSchema['ui:order']];
    const filteredOrder = order.filter((item) => item !== moveField);
    const index = filteredOrder.indexOf(afterField);

    filteredOrder.splice(index + 1, 0, moveField);

    return {
      ...uiSchema,
      'ui:order': filteredOrder,
    };
  }

  useEffect(() => {
    let timer: any;
    if (verificationSuccessModal) {
      timer = setTimeout(() => {
        //   router.push(`/account-selection?newAccount=${'true'}`);
        // params.set('newAccount', 'true');

        onCloseSuccessModal();
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [verificationSuccessModal]);
  const handleCreateAccount = async () => {
    try {
      const localPayload = localStorage.getItem('localPayload');
      if (localPayload && tenantId) {
        const payloadData = JSON.parse(
          localStorage.getItem('localPayload') || '{}'
        );
        const tenantData = [{ roleId: RoleId.STUDENT, tenantId: tenantId }];

        //delete mobile or guardian detail from dob
        let updated_payload = payload;
        if (isUnderEighteen(updated_payload?.dob)) {
          //  delete updated_payload?.mobile;
          updated_payload.mobile = formData?.parent_phone;
        } else {
          const fieldIdsToRemove = [
            'd7a56014-0b9a-4f16-b07e-88baea79576d',
            '3a7bf305-6bac-4377-bf09-f38af866105c',
            '7ecaa845-901a-4ac7-a136-eed087f3b85b',
          ];
          updated_payload = {
            ...payload,
            customFields: payload.customFields.filter(
              (field: any) => !fieldIdsToRemove.includes(field.fieldId)
            ),
          };
          delete formData?.parent_phone;
          delete formData?.guardian_relation;
          delete formData?.guardian_name;
        }

        const createuserPayload = {
          ...updated_payload,
          username: username,
          password: password,
          program: tenantId,
          tenantCohortRoleMapping: tenantData,
        };
        localStorage.setItem('localPayload', JSON.stringify(createuserPayload));
        localStorage.setItem(
          'loginLocalPayload',
          JSON.stringify(createuserPayload)
        );
        const responseUserData = await createUser(createuserPayload);
        console.log(responseUserData);
        if (responseUserData) {
          localStorage.removeItem('localPayload');
          localStorage.removeItem('formData');

          setSignupSuccessModal(true);
        } else {
          showToastMessage('Username Already Exist', 'error');
        }

        console.log(responseUserData);
      }
    } catch (error) {}
  };
  // formData.mobile = '8793607919';
  // formData.firstName = 'karan';
  // formData.lastName = 'patil';
  console.log(payload);

  const handleSendOtp = async (mob: string) => {
    try {
      const reason = 'signup';
      const response = await sendOTP({ mobile: mob, reason });

      console.log('sendOTP', response);
      setHash(response?.result?.data?.hash);
      setOtpModal(true);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
    }
  };

  const handleAccountValidation = async (formData: any) => {
    try {
      const isEmailCheck = Boolean(formData.email);
      const payload = isEmailCheck
        ? { email: formData.email }
        : {
            firstName: formData.firstName,
            mobile: isUnderEighteen(formData.dob)
              ? formData.parent_phone
              : formData.mobile,
          };

      const response = await userCheck(payload);
      const users = response?.result || [];
      if (users.length > 0 && isEmailCheck) {
        showToastMessage('Email already exists', 'error');
      } else if (users.length > 0) {
        const usernameList = users.map((user: any) => user.username);

        setUsernames(usernameList);
        setAccountExistModal(true);
      } else {
        setOtpModal(true);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(error.response?.data?.params?.errmsg);
      }
      const errorMessage = error.response?.data?.params?.errmsg;
      if (errorMessage == 'User does not exist') {
        let reason = 'signup';
        handleSendOtp(
          isUnderEighteen(formData.dob)
            ? formData.parent_phone
            : formData.mobile
        );
      }
      // errmsg: 'User does not exist'

      console.error('Error in account validation:', error);
      // Optionally handle fallback here
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };
  const handleCloseModal = () => {
    setAccountExistModal(false);
  };
  const handleOTPModal = () => {
    setOtpModal(false);
    setOtp(['', '', '', '']);
  };
  const onCreateAnotherAccount = async () => {
    setAccountExistModal(false);
    await handleSendOtp(mobile);
  };
  const onVerify = async () => {
    try {
      // let mobile = mobile.toString();
      let reason = 'signup';
      // let username = enterdUserName;
      const response = await verifyOTP({
        mobile: mobile.toString(),
        reason,
        otp: otp.join(''),
        hash,
        //  username,
      });
      console.log('verifyOtp', response);
      const isValid = response.result.success;
      localStorage.setItem('tokenForResetPassword', response.result.token); // temporary assume true

      if (isValid) {
        setVerificationSuccessModal(true);
        setOtpModal(false);

        // router.push('/reset-Password');
      } else {
        showToastMessage('Please enter valid otp', 'error');
      }
    } catch (error) {
      showToastMessage('Please enter valid otp', 'error');
    } finally {
      setOtp(['', '', '', '']);
    }
  };
  const onResend = async () => {
    try {
      let reason = 'forgot';
      const response = await sendOTP({ mobile: mobile, reason });
      console.log('sendOTP', response);
      setHash(response?.result?.data?.hash);
    } catch (error) {}
  };

  const onCloseSuccessModal = () => {
    //  const route = localStorage.getItem('redirectionRoute');
    //   if (route) router.push(route);
console.log("onCloseSuccessModal" ,formData)
setUsername(
  (formData?.firstName || '') +
    (formData?.lastName || '') +
    Math.floor(10 + Math.random() * 90) // random 2-digit number
);
  setVerificationSuccessModal(false);
    setUsernamePasswordForm(true);
  };
  const onCloseSignupSuccessModal = () => {
    //  const route = localStorage.getItem('redirectionRoute');
    //   if (route) router.push(route);

    setSignupSuccessModal(false);
    // setUsernamePasswordForm(true);
  };
  const onCloseInvalidLinkModal = () => {};
  const renderHomePage = () => {
    router.push('/');
  };
  const onSigin = async () => {
    let username;
    let password;
    console.log(username, password);

    //   const loginLocalPayload = localStorage.getItem('loginLocalPayload');
    if (true) {


      const payloadData = JSON.parse(
        localStorage.getItem('loginLocalPayload') || '{}'
      );
      username = payloadData?.username;
      password = payloadData?.password;
     
    }

    try {
      if (username && password) {
        const response = await login({ username, password });
        if (response?.result?.access_token) {
          if (typeof window !== 'undefined' && window.localStorage) {
            const token = response.result.access_token;
            const refreshToken = response?.result?.refresh_token;
            localStorage.setItem('token', token);

            const userResponse = await getUserId();

            if (userResponse) {
              if (
                userResponse?.tenantData?.[0]?.roleName === 'Learner' 
              //  userResponse?.tenantData?.[0]?.tenantName === 'YouthNet'
              ) {
             const tenantName = userResponse?.tenantData?.[0]?.tenantName;
                localStorage.setItem('userProgram', tenantName);
            const uiConfig = userResponse?.tenantData?.[0]?.params?.uiConfig;
             localStorage.setItem('uiConfig', JSON.stringify(uiConfig || {}));

                localStorage.setItem('userId', userResponse?.userId);
                console.log(userResponse?.tenantData);
                localStorage.setItem(
                  'templtateId',
                  userResponse?.tenantData?.[0]?.templateId
                );
                
                localStorage.setItem('userIdName', userResponse?.username);
                localStorage.setItem('name', userResponse?.firstName);
                localStorage.setItem(
                  'firstName',
                  userResponse?.firstName || ''
                );

                const tenantId = userResponse?.tenantData?.[0]?.tenantId;
                localStorage.setItem('tenantId', tenantId);

                const channelId = userResponse?.tenantData?.[0]?.channelId;
                localStorage.setItem('channelId', channelId);

                const collectionFramework =
                  userResponse?.tenantData?.[0]?.collectionFramework;
                localStorage.setItem(
                  'collectionFramework',
                  collectionFramework
                );

                document.cookie = `token=${token}; path=/; secure; SameSite=Strict`;

                router.push('/content');
              } else {
                // showToastMessage(
                //   'LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT',
                //   'error'
                // );
              }
            }
          }
        } else {
          // showToastMessage('LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT', 'error');
        }
        setSignupSuccessModal(false);
      }
      // setLoading(false);
    } catch (error: any) {
      //   setLoading(false);
      const errorMessage = 'LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT';
      showToastMessage(errorMessage, 'error');
    }
  };
  //   const handleLogin = async () => {
  //     if (formData.email) {
  //       const email = formData.email;
  //       const response = await userCheck({ email });
  //       console.log('response', response.result);
  //       const userList = response.result.map((user: any) => ({
  //         name: [user.firstName, user.middleName, user.lastName]
  //           .filter(Boolean)
  //           .join(' '),
  //         username: user.username,
  //       }));
  //       const usernameList = response.result.map((user: any) => user.username);

  //       console.log(usernameList);
  //       setUsernames(usernameList);
  //     }
  //   };
  const FormSubmitFunction = async (formData: any, payload: any) => {
    console.log('formData', formData);
    localStorage.setItem('formData', JSON.stringify(formData));
    setPayload(payload);
    localStorage.setItem('localPayload', JSON.stringify(payload));
    localStorage.setItem('loginLocalPayload', JSON.stringify(payload));

    setFormData(formData);
    handleAccountValidation(formData);
    console.log(formData.parent_phone);
    console.log(payload);
    console.log(formData.dob);
    console.log(isUnderEighteen(formData.dob));
    if (isUnderEighteen(formData.dob)) {
      setMobile(formData.parent_phone);
    } else {
      setMobile(formData.mobile);
    }
  };
  return (
    <Box
      height="100vh"
      width="100vw"
      display="flex"
      flexDirection="column"
      sx={{
        background: 'linear-gradient(to bottom, #fff7e6, #fef9ef)',
        overflow: 'auto',
      }}
    >
      <Header />

      {loading ? (
        <Box
          width="100%"
          id="check"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Loader isLoading={true} layoutHeight={0}>
            {/* Your actual content goes here, even if it's an empty div */}
            <div />
          </Loader>{' '}
        </Box>
      ) : usernamePasswordForm ? (
        <>
          {' '}
          <Box
            sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
            onClick={() => {
              if (usernamePasswordForm) {
                setUsernamePasswordForm(false);
              } else router.back();
            }}
          >
            <IconButton>
              <ArrowBackIcon />
            </IconButton>
          </Box>
          <Box mb={'30px'}>
            <CreateAccountForm
              username={username}
              onUsernameChange={setUsername}
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={handleCreateAccount}
              belowEighteen={formData.guardian_name ? true : false}
              tenantName={tenantName}
            />
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: `'Inter', sans-serif`, // assuming Inter or similar
              mt: '15px',
            }}
          >
            <Typography
              variant="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontFamily: 'Poppins, sans-serif',
                lineHeight: '24px',
                letterSpacing: '0.5px',
                textAlign: 'center',
              }}
            >
              {t('LEARNER_APP.REGISTRATION.SIGN_UP_FOR')}

              {tenantName}
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '24px',
                letterSpacing: '0.5px',
                textAlign: 'center',
                p: '5px',
              }}
            >
              {t('LEARNER_APP.REGISTRATION.GET_VOCATIONAL_TRAINING_TO_LAND')}
              <Box
                component="br"
                sx={{ display: { xs: 'block', sm: 'none' } }}
              />
              {t(
                'LEARNER_APP.REGISTRATION.AN_ENTRY_LEVEL_JOB_WITH_2_MONTHS_OF'
              )}
              <Box
                component="br"
                sx={{ display: { xs: 'block', sm: 'none' } }}
              />
              {t('LEARNER_APP.REGISTRATION.TRAINING')}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '24px',
                letterSpacing: '0.5px',
                textAlign: 'center',
              }}
            >
              {t('LEARNER_APP.REGISTRATION.ALREADY_SIGNED_UP')}
              <Link
                href="/login"
                underline="hover"
                color="secondary"
                sx={{ fontWeight: '500' }}
              >
                {t('LEARNER_APP.REGISTRATION.CLICK_HERE_TO_LOGIN')}
              </Link>
            </Typography>
          </Box>
          <Box
            sx={{
              ml: 'auto',
              mr: 'auto',
              width: {
                xs: '90vw',
                md: '50vw',
              },
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#fff',
              p: {
                xs: '20px',
                md: '40px',
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Image src={face} alt="Step Icon" />
              <Typography fontWeight={600}>
                {t('LEARNER_APP.REGISTRATION.TELL_US_ABOUT_YOURSELF')}
              </Typography>
            </Box>

            <Alert
              icon={<PriorityHighIcon htmlColor="black" />}
              severity="info"
              sx={{
                backgroundColor: '#F7EBD9',
                color: '#000',
                //  fontSize: '14px',
                mt: 2,
                mb: 3,
              }}
            >
              {t(
                'LEARNER_APP.LOGIN.make_sure_to_cross_check_the_state_district_block_village'
              )}
            </Alert>
            {addSchema && addUiSchema && (
              <DynamicForm
                schema={addSchema}
                uiSchema={addUiSchema}
                FormSubmitFunction={FormSubmitFunction}
                prefilledFormData={formData}
                hideSubmit={true}
                type={'learner'}
              />
            )}
            <Button
              sx={{
                mt: 3,
                backgroundColor: '#FFC107',
                color: '#000',
                fontFamily: 'Poppins',
                fontWeight: 500,
                fontSize: '14px',
                height: '40px',
                lineHeight: '20px',
                letterSpacing: '0.1px',
                textAlign: 'center',
                verticalAlign: 'middle',
                '&:hover': {
                  backgroundColor: '#ffb300',
                },
              }}
              form="dynamic-form-id"
              type="submit"
            >
              {t('LEARNER_APP.REGISTRATION.CONTINUE')}
            </Button>
          </Box>
        </>
      )}

      <SimpleModal
        open={accountExistModal}
        onClose={handleCloseModal}
        showFooter
        primaryText={'Yes, Create Another Account'}
        modalTitle={'Account Already Exists'}
        primaryActionHandler={onCreateAnotherAccount}
        footerText="Are you sure you want to create another account?"
      >
        <AccountExistsCard
          fullName={firstLetterInUpperCase(
            formData.firstName + ' ' + formData?.lastName
          )}
          usernames={usernames}
          onLoginClick={handleLoginClick}
        />
      </SimpleModal>

      <SimpleModal
        open={otpmodal && mobile ? true : false}
        onClose={handleOTPModal}
        showFooter
        primaryText={'Verify OTP'}
        modalTitle={'Verify Your Phone Number'}
        primaryActionHandler={onVerify}
      >
        <OtpVerificationComponent
          onResend={onResend}
          otp={otp}
          setOtp={setOtp}
          maskedNumber={maskMobileNumber(mobile || '')}
        />
      </SimpleModal>

      <SimpleModal
        open={verificationSuccessModal}
        onClose={onCloseSuccessModal}
        showFooter={false}
        primaryText={'Okay'}
        primaryActionHandler={onCloseSuccessModal}
      >
        <Box p="10px">
          <MobileVerificationSuccess />
        </Box>
      </SimpleModal>

      <SimpleModal
        open={signupSuccessModal}
        onClose={onCloseSignupSuccessModal}
        showFooter={true}
        primaryText={'Start learning'}
        primaryActionHandler={onSigin}
      >
        <Box p="10px">
          <SignupSuccess />
        </Box>
      </SimpleModal>

      <SimpleModal
        open={invalidLinkModal}
        onClose={onCloseInvalidLinkModal}
        showFooter={true}
        primaryText={'Okay'}
        primaryActionHandler={renderHomePage}
      >
        <Box p="10px">{t('LEARNER_APP.REGISTRATION.INVALID_LINK')}</Box>
      </SimpleModal>
    </Box>
  );
};

export default RegisterUser;
