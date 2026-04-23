import {
  Card,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import React, { useState } from "react";
import CommonModal from "../common-modal";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ExpandableText, useTranslation } from "@shared-lib";
import BreadCrumb from "../BreadCrumb";
import SpeakableText from "@shared-lib-v2/lib/textToSpeech/SpeakableText";
import LoginIcon from "@mui/icons-material/Login";
import { transformImageUrl } from "../../utils/imageUtils";

interface InfoCardProps {
  item: any;
  topic?: string;
  onBackClick?: () => void;
  _config?: any;
  checkLocalAuth?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  item,
  topic,
  onBackClick,
  _config,
  checkLocalAuth,
}) => {
  const { t } = useTranslation();
  const { _infoCard } = _config || {};
  const [openModal, setOpenModal] = useState(false);

  console.log("InfoCard - item:", item);
  console.log("InfoCard - item.posterImage:", item?.posterImage);
  console.log("InfoCard - item.appIcon:", item?.appIcon);
  console.log("InfoCard - _infoCard.default_img:", _infoCard?.default_img);

  // Process image URL to handle relative URLs and transform Azure URLs to AWS S3
  const processImageUrl = (url?: string) => {
    if (!url) return "";

    // First transform the URL if it's from Azure Blob Storage
    const transformedUrl = transformImageUrl(url);

    // If it's already an absolute URL, return as is
    if (
      transformedUrl.startsWith("http://") ||
      transformedUrl.startsWith("https://")
    ) {
      return transformedUrl;
    }

    // If it's a relative URL, construct the full URL
    const baseUrl =
      process.env.NEXT_PUBLIC_MIDDLEWARE_URL ||
      "https://interface.tekdinext.com";
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanImageUrl = transformedUrl.startsWith("/")
      ? transformedUrl.slice(1)
      : transformedUrl;

    return `${cleanBaseUrl}/${cleanImageUrl}`;
  };

  const finalImageUrl =
    processImageUrl(item?.posterImage || item?.appIcon) ||
    _infoCard?.default_img;
  console.log("InfoCard - processed final image URL:", finalImageUrl);

  return (
    <>
      <Card
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row", md: "row" },
          borderRadius: 0,
          ..._infoCard?._card,
          boxShadow: "none",
          backgroundColor: "#F5F5F5",
        }}
      >
        <CardMedia
          component="img"
          sx={{
            flex: { xs: 6, md: 4, lg: 3, xl: 3 },
            maxHeight: { xs: "200px", sm: "280px" },
            // objectFit: 'contain',
            ..._infoCard?._cardMedia,
          }}
          image={finalImageUrl}
          alt={item?.name}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: { xs: 6, md: 8, lg: 9, xl: 9 },
            ..._infoCard?._textCard,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: "1 0 auto",
              p: { xs: "16px", md: "18px" },
              pb: { xs: "0px", md: "18px" },
              gap: 1.5,
              width: { xs: "90%", sm: "85%" },
            }}
          >
            {onBackClick && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pt: { xs: 0, md: 0 },
                }}
              >
                <IconButton
                  aria-label="back"
                  onClick={onBackClick}
                  sx={{ width: "24px", height: "24px" }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <BreadCrumb
                  breadCrumbs={_infoCard?.breadCrumbs}
                  topic={topic}
                />
              </Box>
            )}
            <Typography
              component="div"
              // @ts-ignore
              variant="body8"
              title={item?.name}
              sx={{
                fontWeight: 700,
                // fontSize: { xs: '22px', sm: '24px', md: '36px' },
                // lineHeight: { xs: '28px', sm: '32px', md: '44px' },
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textTransform: "capitalize",
              }}
            >
              <SpeakableText>{item?.name}</SpeakableText>
            </Typography>
            <ExpandableText
              text={item?.description}
              maxLines={2}
              _text={{
                fontSize: { xs: "14px", sm: "16px", md: "18px" },
                lineHeight: { xs: "20px", sm: "22px", md: "26px" },
              }}
            />
            <Box>
              {_infoCard?.isShowStatus &&
                (item?.issuedOn ? (
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{
                      fontWeight: 500,
                      // fontSize: { xs: '14px', sm: '16px', md: '16px' },
                      // lineHeight: { xs: '20px', sm: '22px', md: '26px' },
                      color: "#00730B",
                      letterSpacing: "0.15px",
                    }}
                  >
                    <CheckCircleIcon
                      sx={{ color: "#00730B", fontSize: 20, mr: 1 }}
                    />
                    <SpeakableText>
                      {t("LEARNER_APP.COURSE.COMPLETED_ON")}:{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }).format(new Date(item?.issuedOn))}
                    </SpeakableText>
                  </Typography>
                ) : (
                  item?.startedOn && (
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        width: "fit-content",
                        borderRadius: "12px",
                        pt: 1,
                        pr: 2,
                        pb: 1,
                        pl: 2,
                        bgcolor: "#FFDEA1",
                        // fontSize: { xs: '14px', sm: '16px', md: '16px' },
                        // lineHeight: { xs: '20px', sm: '22px', md: '26px' },
                      }}
                    >
                      <SpeakableText>
                        {t("LEARNER_APP.COURSE.STARTED_ON")}:{" "}
                        {item?.startedOn
                          ? new Intl.DateTimeFormat("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }).format(new Date(item.startedOn))
                          : " - "}
                      </SpeakableText>
                      {/* {JSON.stringify(_infoCard?.isShowStatus || {})} */}
                    </Typography>
                  )
                ))}
              {!_infoCard?.isHideStatus && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 1 }}
                  onClick={() => setOpenModal(true)}
                >
                  <SpeakableText>{t("COMMON.ENROLL_NOW")}</SpeakableText>
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Card>

      <CommonModal
        open={openModal}
        // onClose={() => setOpenModal(false)}
        buttonText={checkLocalAuth ? "Start Learning" : "Login First"}
        onStartLearning={_config?.onButtonClick}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2,
            px: 3,
          }}
        >
          {checkLocalAuth ? (
            <CheckCircleIcon sx={{ color: "#21A400", fontSize: 48, mb: 1 }} />
          ) : (
            <LoginIcon sx={{ color: "#21A400", fontSize: 48, mb: 1 }} />
          )}

          <Typography
            variant="h1"
            component="div"
            sx={{
              fontWeight: 400,
              // fontSize: '22px',
              // lineHeight: '28px',
              letterSpacing: "0px",
              textAlign: "center",
              color: "#1F1B13",
              mb: 1,
            }}
          >
            <SpeakableText>
              {checkLocalAuth ? "Awesome!" : "Login First"}
            </SpeakableText>
          </Typography>
          <Typography
            variant="body1"
            component="div"
            sx={{
              mb: 0,
              fontWeight: 400,
              // fontSize: '16px',
              // lineHeight: '24px',
              letterSpacing: "0.5px",
              textAlign: "center",
              color: "#1F1B13",
            }}
          >
            <SpeakableText>
              {checkLocalAuth
                ? "You are now enrolled to the course!"
                : "you need to login first"}
            </SpeakableText>
          </Typography>
        </Box>
      </CommonModal>
    </>
  );
};

export default React.memo(InfoCard);
