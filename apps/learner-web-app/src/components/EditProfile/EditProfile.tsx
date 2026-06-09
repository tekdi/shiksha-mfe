'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, Link, Typography, useRadioGroup } from '@mui/material';
import SimpleModal from '@learner/components/SimpleModal/SimpleModal';
import { showToastMessage } from '@learner/components/ToastComponent/Toastify';
import axios from 'axios';

import DynamicForm from '@shared-lib-v2/DynamicForm/components/DynamicForm';
import {
  fetchForm,
  splitUserData,
} from '@shared-lib-v2/DynamicForm/components/DynamicFormCallback';
import { FormContext } from '@shared-lib-v2/DynamicForm/components/DynamicFormConstant';
import { useRouter } from 'next/navigation';
import { createUser } from '@shared-lib-v2/DynamicForm/services/CreateUserService';
import { RoleId } from '@shared-lib-v2/DynamicForm/utils/app.constant';
import { Loader, useTranslation } from '@shared-lib';
import {
  firstLetterInUpperCase,
  getMissingFields,
  isUnderEighteen,
  mapUserData,
} from '@learner/utils/helper';
import face from '../../../public/images/Group 3.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

//build issue fix for  ⨯ useSearchParams() should be wrapped in a suspense boundary at page
import { useSearchParams } from 'next/navigation';
import { getTenantInfo } from '@learner/utils/API/ProgramService';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';

import Image from 'next/image';
import { set } from 'lodash';
import {
  getUserDetails,
  profileComplitionCheck,
  updateUser,
} from '@learner/utils/API/userService';

type UserAccount = {
  name: string;
  username: string;
};
interface EditProfileProps {
  completeProfile: boolean;
}

const EditProfile = ({ completeProfile }: EditProfileProps) => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // let formData: any = {};
  const [loading, setLoading] = useState(true);
  const [invalidLinkModal, setInvalidLinkModal] = useState(false);

  const localFormData = JSON.parse(localStorage.getItem('formData') || '{}');
  const [userFormData, setUserFormData] = useState<any>(localFormData);
  const [userData, setuserData] = useState<any>({});

  const localPayload = JSON.parse(localStorage.getItem('localPayload') || '{}');

  //formData.email = 'a@tekditechnologies.com';

  const router = useRouter();

  const [addSchema, setAddSchema] = useState(null);
  const [addUiSchema, setAddUiSchema] = useState(null);

  // const [schema, setSchema] = useState(facilitatorSearchSchema);
  // const [uiSchema, setUiSchema] = useState(facilitatorSearchUISchema);
  useEffect(() => {
    // const token = localStorage.getItem('token');
    if (!checkAuth()) {
      router.push('/login');
    }
  }, []);
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
          {
            fetchUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/form/read?context=${FormContext.learner.context}&contextType=${FormContext.learner.contextType}`,
            header: {
              tenantid: localStorage.getItem('tenantId'),
            },
          },
        ]);
        console.log('responseForm', responseForm?.schema);
        const r = await profileComplitionCheck();
        console.log(r);
        delete responseForm?.schema?.properties.password;
        delete responseForm?.schema?.properties.confirm_password;
        delete responseForm?.schema?.properties.username;
        delete responseForm?.schema?.properties.program;
        delete responseForm?.schema?.properties.batch;
        delete responseForm?.schema?.properties.center;
        delete responseForm?.schema?.properties.state;
        delete responseForm?.schema?.properties.district;
        delete responseForm?.schema?.properties.block;
        delete responseForm?.schema?.properties.village;

        responseForm?.schema?.required.pop('batch');
        let userId = localStorage.getItem('userId');
        if (userId) {
          const useInfo = await getUserDetails(userId, true);
          console.log('useInfo', useInfo?.result?.userData);
          setuserData(useInfo?.result?.userData);
          const mappedData = mapUserData(useInfo?.result?.userData);
          console.log(mappedData);
          const allowNameUpdate = searchParams.get('updateName') === 'true' || mappedData?.firstName === mappedData?.mobile;
          if (isUnderEighteen(useInfo?.result?.userData?.dob)) {
            delete responseForm?.schema.properties.mobile;
          }

          const updatedSchema = getMissingFields(
            responseForm?.schema,
            useInfo?.result?.userData
          );
          console.log(updatedSchema);

          let alterSchema = completeProfile
            ? updatedSchema
            : responseForm?.schema;
          let alterUISchema = responseForm?.uiSchema;

          if (alterSchema?.properties?.firstName) {
            alterSchema.properties.name = {
              type: 'string',
              title: t('LEARNER_APP.EDIT_PROFILE.NAME_LABEL', { defaultValue: 'Full Name' }),
            };
            if (alterSchema.required) {
               alterSchema.required = alterSchema.required.filter((r: string) => r !== 'firstName' && r !== 'lastName');
               if (!alterSchema.required.includes('name')) {
                 alterSchema.required.push('name');
               }
            }
            delete alterSchema.properties.firstName;
            delete alterSchema.properties.lastName;
            
            alterUISchema.name = {
              'ui:options': { grid: { xs: 12, sm: 12, md: 12 } }
            };
            
            mappedData.name = `${mappedData.firstName || ''} ${mappedData.lastName || ''}`.trim();
          }

          setUserFormData(mappedData);
          //unit name is missing from required so handled from frotnend

          //set 2 grid layout
          alterUISchema = enhanceUiSchemaWithGrid(alterUISchema);
          console.log('alterUISchema', alterUISchema);
          if (!completeProfile) {
            alterUISchema = {
              ...alterUISchema,
              name: {
                ...(alterUISchema.name || {}),
                'ui:disabled': !allowNameUpdate,
              },
              dob: {
                ...(alterUISchema.dob || {}),
                'ui:disabled': true,
              },
            };
          }
          delete alterSchema?.properties?.is_volunteer;
          setAddSchema(alterSchema);
          setAddUiSchema(alterUISchema);
        }
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

  // formData.mobile = '8793607919';
  // formData.firstName = 'karan';
  // formData.lastName = 'patil';

  const onCloseInvalidLinkModal = () => {};
  const renderHomePage = () => {
    router.push('/');
  };

  const FormSubmitFunction = async (formData: any, payload: any) => {
    console.log('formData', formData);
    console.log(userFormData);
    if (userFormData.email == payload.email) {
      delete payload.email;
    }

    if (payload.name) {
      const nameParts = payload.name.trim().split(/\s+/);
      payload.firstName = nameParts[0] || '';
      payload.lastName = nameParts.slice(1).join(' ') || '';
      delete payload.name;
    }

    console.log('payload', payload);
    const { userData, customFields } = splitUserData(payload);
    
    if (userData.firstName) {
      localStorage.setItem('firstName', userData.firstName);
      localStorage.setItem('name', userData.firstName);
    }
    if (userData.lastName) {
      localStorage.setItem('lastName', userData.lastName);
    }

    const parentPhoneField = customFields.find(
      (field: any) => field.value === formData.parent_phone
    );
    console.log('Parent Phone Field:', parentPhoneField);
    if (parentPhoneField) {
      userData.mobile = parentPhoneField.value;
    }
    let userId = localStorage.getItem('userId');
    const object = {
      userData: {
        ...userData,
        future_work: t('LEARNER_APP.EDIT_PROFILE.FUTURE_WORK'),
      },
      customFields: customFields,
    };
    if (userId) {
      const updateUserResponse = await updateUser(userId, object);
      // console.log('updatedResponse', updateUserResponse);

      if (
        updateUserResponse &&
        updateUserResponse?.data?.params?.err === null
      ) {
        showToastMessage('Profile Updated succeessfully', 'success');
      }
      if (completeProfile) {
        router.push('/content');
      }
    }

    console.log(payload);
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
          </Loader>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              //   p: 2,
              mt: 2,
              ml: 2,
              cursor: 'pointer',
              width: 'fit-content',
              background: 'linear-gradient(to bottom, #fff7e6, #fef9ef)',
            }}
            onClick={() => router.back()}
          >
            <ArrowBackIcon
              sx={{ color: '#4B5563', '&:hover': { color: '#000' } }}
            />
          </Box>
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: `'Inter', sans-serif`,
              mb: '10px',
              // assuming Inter or similar
              //   mt: '15px',
              //  p: '25px',
            }}
          >
            <Typography
              variant="body8"
              component="h2"
              sx={{
                fontWeight: 600,
                // fontSize: '24px',
                // lineHeight: '32px',
                letterSpacing: '0px',
                textAlign: 'center',
              }}
            >
              {t(
                completeProfile
                  ? 'LEARNER_APP.EDIT_PROFILE.COMPLETE_PROFILE_TITLE'
                  : 'LEARNER_APP.EDIT_PROFILE.TITLE'
              )}
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
              p: '40px',
            }}
          >
            {completeProfile && (
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Image src={face} alt="Step Icon" />
                <Typography fontWeight={600}>
                  {t('LEARNER_APP.EDIT_PROFILE.BACKGROUND_HELP_TEXT')}
                </Typography>
              </Box>
            )}
            {addSchema && addUiSchema && (
              <DynamicForm
                schema={addSchema}
                uiSchema={addUiSchema}
                FormSubmitFunction={FormSubmitFunction}
                prefilledFormData={completeProfile ? {} : userFormData}
                hideSubmit={true}
                type="learner"
                isCompleteProfile={completeProfile}
              />
            )}
            <Button
              sx={{
                mt: 3,
                backgroundColor: '#FFC107',
                color: '#000',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#ffb300',
                },
              }}
              form="dynamic-form-id"
              type="submit"
            >
              {t('COMMON.SUBMIT')}
            </Button>
          </Box>
        </>
      )}

      <SimpleModal
        open={invalidLinkModal}
        onClose={onCloseInvalidLinkModal}
        showFooter={true}
        primaryText={'Okay'}
        primaryActionHandler={renderHomePage}
      >
        <Box p="10px">{t('LEARNER_APP.EDIT_PROFILE.INVALID_LINK')}</Box>
      </SimpleModal>
    </Box>
  );
};

export default EditProfile;
