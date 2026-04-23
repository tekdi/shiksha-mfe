"use client";

import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import Image from "next/image";
// import welcomeGIF from "../../../public/images/welcome.gif";
import welcomeGIF from "../../../public/logo.png";
import playstoreIcon from "../../../public/images/playstore.png";
import prathamQRCode from "../../../public/images/prathamQR.png";
import { useTranslation } from "@shared-lib";
import { useRouter } from "next/navigation";

const WelcomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Box
   
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={2}
      textAlign="center"
      sx={{
        minHeight: { xs: "auto", sm: "100vh" },
      }}
    >
      <Image
        src={welcomeGIF}
        alt={t("LEARNER_APP.LOGIN.welcome_image_alt")}
        width={120}
        height={120}
        style={{ marginBottom: "24px" }}
      />

      <Typography
        variant="body9"
        component="h2"
        fontWeight={400}
        textAlign="center"
        sx={{ verticalAlign: "middle" }}
      >
        {t("LEARNER_APP.LOGIN.welcome_title")}
      </Typography>
      <Typography
        variant="h1"
        fontWeight={400}
        textAlign="center"
        sx={{ verticalAlign: "middle" }}
        mb={4}
      >
        {t("LEARNER_APP.LOGIN.welcome_subtitle")}
      </Typography>

      {/* <Grid
        container
        alignItems="center"
        justifyContent="center"
        maxWidth="700px"
      >
        <Grid item xs={12} sm={5} md={4}>
          <Box
            display="flex"
            flexDirection={{
              xs: 'column',
              sm: 'column',
              md: 'column',
              lg: 'row',
            }}
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Image
              src={prathamQRCode}
              alt={t('LEARNER_APP.LOGIN.qr_image_alt')}
              width={70}
              height={70}
            />
            <Box textAlign="center">
              <Typography fontWeight={600} fontSize="16px">
                {t('LEARNER_APP.WELCOME_SCREEN.GET_APP')}
              </Typography>
              <Typography fontSize="14px" color="textSecondary">
                {t('LEARNER_APP.WELCOME_SCREEN.POINT_PHONE')}
                <br />
                {t('LEARNER_APP.WELCOME_SCREEN.CAMERA_HERE')}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          sm={2}
          md={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography fontWeight={500} fontSize="18px">
            {t('LEARNER_APP.WELCOME_SCREEN.OR')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={5} md={5}>
          <Box
            display="flex"
            flexDirection={{
              xs: 'column',
              sm: 'column',
              md: 'column',
              lg: 'row',
            }}
            alignItems="center"
            justifyContent="center"
            gap={2}
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              router.push(
                'https://play.google.com/store/apps/details?id=com.pratham.learning'
              );
            }}
          >
            <Image
              src={playstoreIcon}
              alt={t('LEARNER_APP.LOGIN.playstore_image_alt')}
              width={140}
              height={44}
            />
            <Box textAlign="center">
              <Typography
                fontSize="14px"
                color="textSecondary"
                sx={{
                  whiteSpace: 'normal',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  textAlign: 'center',
                }}
              >
                {t('LEARNER_APP.WELCOME_SCREEN.SEARCH_TEXT')}{' '}
                <b>{t('LEARNER_APP.WELCOME_SCREEN.APP_NAME')}</b>
                <br />
                {t('LEARNER_APP.WELCOME_SCREEN.ON_PLAYSTORE')}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid> */}
    </Box>
  );
};

export default WelcomeScreen;
