// pages/content-details/[identifier].tsx

'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import {
  ExpandableText,
  findCourseUnitPath,
  useTranslation,
} from '@shared-lib';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchContent } from '@learner/utils/API/contentService';
import BreadCrumb from '@content-mfes/components/BreadCrumb';
import { hierarchyAPI } from '@content-mfes/services/Hierarchy';
import { CardComponent } from './List';
import { transformImageUrl } from '@learner/utils/imageUtils';

const CourseUnitDetails = dynamic(() => import('@CourseUnitDetails'), {
  ssr: false,
});
const getSbPlayerBaseUrl = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    return `${origin}/sbplayer`;
  }
  const fallback = process.env.NEXT_PUBLIC_LEARNER_SBPLAYER || "";
  if (!fallback) return "/sbplayer";
  return fallback.endsWith("/sbplayer")
    ? fallback
    : `${fallback.replace(/\/$/, "")}/sbplayer`;
};

const App = ({
  userIdLocalstorageName,
  contentBaseUrl,
  _config,
}: {
  userIdLocalstorageName?: string;
  contentBaseUrl?: string;
  _config?: any;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { identifier, courseId, unitId } = params || {}; // string | string[] | undefined
  const [item, setItem] = useState<{ [key: string]: any }>({});
  const [breadCrumbs, setBreadCrumbs] = useState<any>();

  let activeLink = null;
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    activeLink = searchParams.get('activeLink');
  }
  useEffect(() => {
    const fetch = async () => {
      const response = await fetchContent(identifier);
      setItem({ content: response });
      if (unitId) {
        const course = await hierarchyAPI(courseId as string);
        const breadcrum = findCourseUnitPath({
          contentBaseUrl: contentBaseUrl,
          node: course,
          targetId: identifier as string,
          keyArray: [
            'name',
            'identifier',
            'mimeType',
            {
              key: 'link',
              suffix: activeLink
                ? `?activeLink=${encodeURIComponent(activeLink)}`
                : '',
            },
          ],
        });
        setBreadCrumbs([
          { label: 'Home', link: '/themantic' },
          ...(breadcrum?.slice(0, -1) || []),
        ]);
      } else {
        setBreadCrumbs([
          { label: 'Home', link: '/themantic' },
          { label: response?.name },
        ]);
      }
    };
    fetch();
  }, [identifier, unitId, courseId, activeLink, contentBaseUrl]);

  if (!identifier) {
    return <div>Loading...</div>;
  }
  // const onBackClick = () => {
  //   if (breadCrumbs?.length > 1) {
  //     if (breadCrumbs?.[breadCrumbs.length - 1]?.link) {
  //       router.push(breadCrumbs?.[breadCrumbs.length - 1]?.link);
  //     }
  //   } else if (contentBaseUrl) {
  //     router.back();
  //   } else {
  //     router.push(`${activeLink ? activeLink : '/content'}`);
  //   }
  // };

  return (
    <Box sx={{ px: 7 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
        }}
      >
        <BreadCrumb
          breadCrumbs={breadCrumbs}
          isShowLastLink
          customPlayerStyle={true}
          customPlayerMarginTop={25}
        />
      </Box>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={12} md={12} lg={3.5}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              // pb: 2,
            }}
          >
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                boxShadow: '0 0.15rem 1.75rem 0 rgba(33, 40, 50, 0.15)',
                border: '1px solid rgba(0, 0, 0, .125)',
                borderRadius: '5px',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 3,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Box sx={{ margin: '8px', px: 3 }}>
                  <img
                    height={'200px'}
                    src={transformImageUrl(item?.content?.posterImage || item?.content?.appIcon) || '/images/image_ver.png'}
                    alt={
                      item?.content?.name || item?.content?.title || 'Content'
                    }
                    style={{ width: '100%', objectFit: 'cover' }}
                  />
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: '700',
                    textAlign: 'center',
                    color: '#000',
                    fontSize: '24px',
                    letterSpacing: '1px',
                    lineHeight: 1.2,
                    mt: 2,
                    mb: 2,
                    px: 2,
                    fontFamily: '"Montserrat", sans-serif',
                  }}
                >
                  {item?.content?.name || item?.content?.title || 'Untitled'}
                </Typography>

                <Divider
                  sx={{
                    width: '100%',
                    mt: 2,
                    mb: 2,
                    height: '4px',
                    backgroundColor: '#9EB6BE',
                  }}
                />

                <Typography
                  sx={{
                    fontSize: '16px',
                    color: '#363d47',
                    fontWeight: '400',
                    px: 2,
                    fontFamily: '"Montserrat", sans-serif',
                  }}
                >
                  {item?.content?.description || 'No description'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={8.5}>
          <PlayerBox
            userIdLocalstorageName={userIdLocalstorageName}
            item={item}
            identifier={identifier}
            courseId={courseId}
            unitId={unitId}
            {..._config?.player}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default App;

const PlayerBox = ({
  item,
  identifier,
  courseId,
  unitId,
  userIdLocalstorageName,
  isGenerateCertificate,
  trackable,
}: any) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [play, setPlay] = useState(false);

  useEffect(() => {
    setPlay(true);
  }, []);

  const handlePlay = () => {
    setPlay(true);
  };
  return (
    <Box
      sx={{
        flex: { xs: 1, sm: 1, md: 8 },
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {!play && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <Avatar
            src={transformImageUrl(item?.posterImage || item?.appIcon) ?? `/images/image_ver.png`}
            alt={item?.identifier}
            style={{
              height: 'calc(100vh - 235px)',
              width: '100%',
              borderRadius: 0,
            }}
          />
          <Button
            variant="contained"
            onClick={handlePlay}
            sx={{
              mt: 2,
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {t('Play')}
          </Button>
        </Box>
      )}

      {play && (
        <Box
          sx={{
            width: '100%',
          }}
        >
          <iframe
            name={JSON.stringify({
              isGenerateCertificate: isGenerateCertificate,
              trackable: trackable,
            })}
            src={`${
              getSbPlayerBaseUrl()
            }?identifier=${identifier}${
              courseId && unitId ? `&courseId=${courseId}&unitId=${unitId}` : ''
            }${
              userIdLocalstorageName
                ? `&userId=${localStorage.getItem(userIdLocalstorageName)}`
                : ''
            }${
              localStorage.getItem("tenantId")
                ? `&tenantId=${localStorage.getItem("tenantId")}`
                : ""
            }`}
            style={{
              border: 'none',
              objectFit: 'contain',
              aspectRatio: '16 / 9',
            }}
            allowFullScreen
            width="100%"
            height="100%"
            title="Embedded Localhost"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            frameBorder="0"
            scrolling="no"
            // Allow downloads and popups (needed for player download / open-in-new-window buttons)
            // Chrome blocks these from sandboxed iframes unless `allow-downloads` / `allow-popups` are set
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-downloads allow-popups"
          />
        </Box>
      )}
    </Box>
  );
};
