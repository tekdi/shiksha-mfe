import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useTheme } from '@mui/material/styles';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import WestIcon from '@mui/icons-material/West';
import { useRouter } from 'next/router';
import { resetPassword } from '@/services/LoginService';
import { showToastMessage } from '@/components/Toastify';


import { telemetryFactory } from '@/utils/telemetry';
import PasswordCreate from '@/components/PasswordCreate';
import CentralizedModal from '@/components/CentralizedModal';
import { Role, TenantName } from '@/utils/app.constant';

const EditForgotPassword = () => {
  const { t } = useTranslation();
  const theme = useTheme<any>();
  const [forgotPassword, setForgotPassword] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const router = useRouter();

  const handleBackEvent = () => {
    window.history.back();
  };

  const handleResetPassword = async (newPassword: string) => {

    try {
      const response = await resetPassword(newPassword); 
      setForgotPassword(true);
    }

    catch (error: any) {
      console.error('Error resetting password:', error);
      setForgotPassword(false);
      showToastMessage(error.response.data.params.err, 'error');
    }
  };
  const handlePrimaryButton = () => {
    const storedUserData = JSON.parse(
      localStorage.getItem("adminInfo") || "{}"
    );
    const { locale } = router; 

    if(storedUserData?.role === Role.SCTA || storedUserData?.role === Role.CCTA)
    {
      // To do :- hardcoding to be removed
      if(storedUserData?.tenantData[0]?.tenantName != TenantName.SECOND_CHANCE_PROGRAM ) {
        router.push("/workspace");
      } else {
        if (locale) 
          router.push("/course-planner", undefined, { locale: locale });
        else
          router.push("/course-planner");
      }
    }else
    {
      if(locale)
      {
        if (storedUserData?.role === Role.CENTRAL_ADMIN && storedUserData?.tenantData[0]?.tenantName == TenantName.SECOND_CHANCE_PROGRAM) {

          router.push("/programs", undefined, { locale: locale });
        } else if (storedUserData?.role === Role.ADMIN && storedUserData?.tenantData[0]?.tenantName == TenantName.SECOND_CHANCE_PROGRAM) {

          router.push("/centers", undefined, { locale: locale });
        } else if ((storedUserData?.role === Role.CENTRAL_ADMIN ||
                    storedUserData?.role === Role.ADMIN)  && storedUserData?.tenantData[0]?.tenantName == TenantName.YOUTHNET) {
          router.push("/mentor", undefined, { locale: locale });
      }
   
      } 
    else
    {
        if (storedUserData?.role === Role.CENTRAL_ADMIN && storedUserData?.tenantData[0]?.tenantName == TenantName.SECOND_CHANCE_PROGRAM) {

          router.push("/programs");
        }
        else if (storedUserData?.role === Role.ADMIN && storedUserData?.tenantData[0]?.tenantName == TenantName.SECOND_CHANCE_PROGRAM) {

          router.push("/centers");
        }
        else if ((storedUserData?.role === Role.CENTRAL_ADMIN ||
                    storedUserData?.role === Role.ADMIN)  && storedUserData?.tenantData[0]?.tenantName == TenantName.YOUTHNET) {
          router.push("/mentor", undefined, { locale: locale });
        }

    }
    }
    localStorage.setItem('skipResetPassword', 'true');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      } else {
        router.push('/home');
      }
    }
  }, []);


  return (
    <Box>
      <Box sx={{ px: '16px', mt: 2 }}>
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <WestIcon
            onClick={handleBackEvent}
            sx={{
              color: theme.palette.warning['A200'],
              cursor: 'pointer',
            }}
          />
          <Box
            sx={{
              color: theme.palette.warning['A200'],
              fontWeight: '400',
              fontSize: '22px',
            }}
          >
            {t('LOGIN_PAGE.RESET_PASSWORD')}
          </Box>
        </Box>
        <Box
          sx={{
            fontSize: '14px',
            color: theme.palette.warning['300'],
            fontWeight: '400',
            mt: 1.5,
          }}
        >
          {t('LOGIN_PAGE.CREATE_NEW')}
        </Box>
        <Box
          sx={{
            '@media (min-width: 700px)': {
              width: '50%',
              boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
              marginTop: '1.8rem',
              borderRadius: '16px',
            },
            width: '100%',
            marginTop: '8rem',
          }}
        >
          <Box sx={{ padding: '30px' }}>
            <PasswordCreate
              handleResetPassword={handleResetPassword}
              editPassword={true}
            />
          </Box>
        </Box>
      </Box>
      <CentralizedModal
        icon={true}
        subTitle={t('LOGIN_PAGE.SUCCESSFULLY_RESET')}
        primary={t('COMMON.OKAY')}
        modalOpen={forgotPassword}
        handlePrimaryButton={handlePrimaryButton}
      />
    </Box>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default EditForgotPassword;
