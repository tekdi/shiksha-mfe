import React, { memo } from "react";
import {
  Breadcrumbs,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SpeakableText from "@shared-lib-v2/lib/textToSpeech/SpeakableText";
import { useRouter } from "next/navigation";
import EastIcon from "@mui/icons-material/East";

const BreadCrumb = ({
  breadCrumbs,
  topic,
  isShowLastLink,
  customPlayerStyle,
  customPlayerMarginTop,
}: {
  breadCrumbs: any;
  topic?: string;
  isShowLastLink?: boolean;
  customPlayerStyle?: boolean;
  customPlayerMarginTop?: number;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const handleClick = (link: string) => {
    router.replace(link);
  };

  if (customPlayerStyle) {
    return (
      <Breadcrumbs
        separator={
          <EastIcon
            sx={{
              fontSize: "25px",
              color: "#000000",
              fontWeight: 900,
              verticalAlign: "middle",
            }}
          />
        }
        aria-label="breadcrumb"
        sx={{
          mt: customPlayerMarginTop ? `${customPlayerMarginTop}px` : undefined,
        }}
      >
        {breadCrumbs?.map((breadcrumb: any, index: number) => {
          const isClickable =
            breadcrumb?.link &&
            (index !== breadCrumbs.length - 1 || isShowLastLink);

          return isClickable ? (
            <Typography
              key={`${breadcrumb?.name ?? breadcrumb?.label ?? ""} ${index}`}
              sx={{
                color: "#212529",
                fontWeight: index === breadCrumbs.length - 1 ? 700 : 400,
                fontSize: "24px",
                display: "inline",
                cursor: "pointer",
                fontFamily: '"Montserrat", sans-serif',
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              component="span"
              onClick={() => handleClick(breadcrumb?.link)}
            >
              {breadcrumb?.name ?? breadcrumb?.label ?? ""}
            </Typography>
          ) : (
            <Typography
              key={`${breadcrumb?.name ?? breadcrumb?.label ?? ""} ${index}`}
              sx={{
                color: "#000000",
                fontWeight: index === breadCrumbs.length - 1 ? 700 : 400,
                fontSize: "24px",
                display: "inline",
                fontFamily: '"Montserrat", sans-serif',
              }}
              component="span"
            >
              {breadcrumb?.name ?? breadcrumb?.label ?? ""}
            </Typography>
          );
        })}
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs separator="›" aria-label="breadcrumb">
      {breadCrumbs?.map((breadcrumb: any, index: number) => {
        return breadcrumb?.link &&
          (index !== breadCrumbs.length - 1 || isShowLastLink)
          ? ((isMobile &&
              index === breadCrumbs.length - (isShowLastLink ? 1 : 2)) ||
              !isMobile) && (
              <Button
                key={`${breadcrumb?.name ?? breadcrumb?.label ?? ""} ${index}`}
                variant="text"
                sx={{
                  color: theme.palette.secondary.main,
                }}
                onClick={() => handleClick(breadcrumb?.link)}
              >
                <SpeakableText>
                  {breadcrumb?.name ?? breadcrumb?.label ?? ""}
                </SpeakableText>
              </Button>
            )
          : !isMobile && (
              <Typography
                key={`${breadcrumb?.name ?? breadcrumb?.label ?? ""} ${index}`}
                variant="body1"
                color="text.secondary"
              >
                <SpeakableText>
                  {breadcrumb?.name ?? breadcrumb?.label ?? ""}
                </SpeakableText>
              </Typography>
            );
      })}
      {(!breadCrumbs || breadCrumbs?.length === 0) &&
        [...(topic ? ["Course", topic] : [])].map((key) => (
          <Typography key={key} variant="body1">
            <SpeakableText>{key}</SpeakableText>
          </Typography>
        ))}
    </Breadcrumbs>
  );
};

export default memo(BreadCrumb);
