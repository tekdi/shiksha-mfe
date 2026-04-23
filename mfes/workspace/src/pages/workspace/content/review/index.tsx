/* eslint-disable @nx/enforce-module-boundaries */
import Players from '@workspace/components/players/Players';
import V1Player from '@workspace/components/V1-Player/V1Player';
import {
  publishContent,
  submitComment,
} from '@workspace/services/ContentService';
import {
  getLocalStoredUserName,
  getLocalStoredUserRole,
} from '@workspace/services/LocalStorageService';
import { fetchContent } from '@workspace/services/PlayerService';
import { MIME_TYPE } from '@workspace/utils/app.config';
import { ContentStatus, Editor, Role } from '@workspace/utils/app.constant';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Card, Grid, IconButton, Typography } from '@mui/material';
import $ from 'jquery';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ConfirmActionPopup from '../../../../components/ConfirmActionPopup';
import {
  playerConfig,
  V1PlayerConfig,
} from '../../../../components/players/PlayerConfig';
import ReviewCommentPopup from '../../../../components/ReviewCommentPopup';
import ToastNotification from '@workspace/components/CommonToast';
import { sendCredentialService } from '@workspace/services/NotificationService';
import { getUserDetailsInfo } from '@workspace/services/userServices';
import { sendContentNotification } from '@workspace/services/sendContentNotification';
import useTenantConfig from '@workspace/hooks/useTenantConfig';
import WorkspaceHeader from '@workspace/components/WorkspaceHeader';

const userFullName = getLocalStoredUserName() || 'Anonymous User';
const [firstName, lastName] = userFullName.split(' ');

const ReviewContentSubmissions = () => {
  const { tenantConfig, isLoading, error } = useTenantConfig();
  const [isContentInteractiveType, setIsContentInteractiveType] =
    useState(false);
  const router = useRouter();
  const { identifier } = router.query;
  const { isDiscoverContent } = router.query;
  const { isReadOnly } = router.query;
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const [showHeader, setShowHeader] = useState<boolean | null>(null);
  const [contentDetails, setContentDetails] = useState<any>(undefined);
  const [openConfirmationPopup, setOpenConfirmationPopup] = useState(false);
  const [confirmationActionType, setConfirmationActionType] = useState<
    'publish' | ''
  >('');
  const [openCommentPopup, setOpenCommentPopup] = useState<boolean>(false);
  const [publishOpenToast, setPublishOpenToast] = useState<boolean>(false);
  const [requestOpenToast, setRequestOpenToast] = useState<boolean>(false);

  useEffect(() => {
    const headerValue = localStorage.getItem('showHeader');
    setShowHeader(headerValue === 'true');
  }, []);

  useEffect(() => {
    if (!tenantConfig?.CHANNEL_ID) return;
    if (typeof window !== 'undefined') {
      window.$ = window.jQuery = $;
    }

    const loadContent = async () => {
      try {
        if (identifier) {
          const data = await fetchContent(identifier);
          // playerConfig.metadata = videoMetadata;
          // playerConfig.metadata = pdfMetadata;
          // playerConfig.metadata = quMLMetadata;
          // playerConfig.metadata = epubMetadata;
          console.log('data ==>', data);
          if (
            MIME_TYPE.INTERACTIVE_MIME_TYPE.includes(data?.mimeType) ||
            data?.mimeType == MIME_TYPE.ECML_MIME_TYPE
          ) {
            V1PlayerConfig.metadata = data;
            V1PlayerConfig.context.contentId = data.identifier;
            V1PlayerConfig.context.channel = tenantConfig?.CHANNEL_ID;
            V1PlayerConfig.context.tags = [tenantConfig?.CHANNEL_ID];
            V1PlayerConfig.context.app = [tenantConfig?.CHANNEL_ID];
            V1PlayerConfig.context.userData.firstName = firstName;
            V1PlayerConfig.context.userData.lastName = lastName || '';
            setIsContentInteractiveType(true);
          } else {
            setIsContentInteractiveType(false);
            playerConfig.metadata = data;
            playerConfig.context.contentId = data.identifier;
            playerConfig.context.channel = tenantConfig?.CHANNEL_ID;
            playerConfig.context.tags = [tenantConfig?.CHANNEL_ID];
            playerConfig.context.userData.firstName = firstName;
            playerConfig.context.userData.lastName = lastName || '';

            // Debug video content
            if (
              data?.mimeType === 'video/mp4' ||
              data?.mimeType === 'video/webm'
            ) {
              console.log('Video content detected:', data);
              console.log('Video URL:', data.artifactUrl);
              console.log('Player config for video:', playerConfig);
            }
          }
          setContentDetails(data);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
      }
    };

    if (identifier) {
      loadContent();
    }
  }, [tenantConfig?.CHANNEL_ID, identifier]);

  const redirectToReviewPage = () => {
    if (isDiscoverContent === 'true') {
      router.push({ pathname: `/workspace/content/discover-contents` });
    } else if (getLocalStoredUserRole() === Role.CCTA) {
      router.push({ pathname: `/workspace/content/up-review` });
    } else router.push({ pathname: `/workspace/content/submitted` });
  };

  const closePublishPopup = () => {
    setOpenConfirmationPopup(false);
  };

  const closeCommentPopup = () => {
    setOpenCommentPopup(false);
  };

  const handleReject = () => {
    console.log('Reject button clicked');
    setOpenCommentPopup(true);
  };

  const handlePublish = () => {
    console.log('Publish button clicked');
    setConfirmationActionType('publish');
    setOpenConfirmationPopup(true);
  };

  const confirmPublishContent = async (checkedItems: string[]) => {
    try {
      const response = await publishContent(identifier as string, {
        publishChecklist: checkedItems,
      });
      console.log('Published successfully:', response);
      // Add toaster success message here
      setOpenConfirmationPopup(false);
      await delay(2000);

      if (getLocalStoredUserRole() === Role.CCTA) {
        setPublishOpenToast(true);
        // Redirect reviewer back to up for review page after showing success message
        setTimeout(() => {
          router.push({ pathname: `/workspace/content/up-review` });
        }, 3000); // Wait 3 seconds to show the success message
        // sendContentPublishNotification()
      } else {
        setPublishOpenToast(true);

        router.push({ pathname: `/workspace/content/submitted` });
      }
    } catch (error) {
      console.error('Error during publishing:', error);
      // Add toaster error message here
    }
  };

  const handleSubmitComment = async (checkedItems: string[], comment: any) => {
    try {
      const response = await submitComment(identifier as string, comment, {
        rejectReasons: checkedItems,
      });
      console.log('Comment submitted successfully:', response);
      // Add toaster success message here
      setOpenCommentPopup(false);
      if (getLocalStoredUserRole() === Role.CCTA) {
        setRequestOpenToast(true);
        // sendContentRejectNotification(comment)
      } else {
        setRequestOpenToast(true);

        router.push({ pathname: `/workspace/content/submitted` });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      // Add toaster error message here
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  const handleBackClick = () => {
    router.back();
  };

  const sendContentPublishNotification = () =>
    sendContentNotification(
      ContentStatus.PUBLISHED,
      Editor.CONTENT,
      '',
      identifier as string,
      contentDetails,
      router
    );
  const sendContentRejectNotification = (comment: any) =>
    sendContentNotification(
      ContentStatus.REJECTED,
      Editor.CONTENT,
      comment,
      identifier as string,
      contentDetails,
      router
    );

  return (
    <>
      {showHeader && <WorkspaceHeader />}
      <Card sx={{ padding: 2, backgroundColor: 'white' }}>
        {publishOpenToast && (
          <ToastNotification
            message="Content published Successfully"
            type="success"
          />
        )}
        {requestOpenToast && (
          <ToastNotification
            message="Requested for changes successfully"
            type="success"
          />
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <IconButton onClick={handleBackClick}>
            <ArrowBackIcon />
          </IconButton>
          {getLocalStoredUserRole() === Role.CCTA &&
            isDiscoverContent !== 'true' &&
            isReadOnly !== 'true' && (
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'inherit',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  lineHeight: '24px',
                  letterSpacing: '0.5px',
                  textAlign: 'left',
                  margin: '1.5rem 1.2rem 0.8rem',
                  color: '#1F1B13',
                }}
                color="primary"
              >
                Review Content Submissions
              </Typography>
            )}
          <IconButton onClick={redirectToReviewPage}>
            <CloseIcon />
          </IconButton>
        </Box>

        {contentDetails ? (
          <>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <Box
                  sx={{
                    border: '1px solid #ccc',
                    borderRadius: '16px',
                    padding: 2,
                    backgroundColor: 'white',
                    height: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'inherit',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                      textAlign: 'left',
                      margin: '0 0 1rem 0',
                      color: '#1F1B13',
                      flexShrink: 0,
                    }}
                    color="primary"
                  >
                    {contentDetails.name}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      minHeight: 0,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isContentInteractiveType ? (
                        <V1Player playerConfig={V1PlayerConfig} />
                      ) : (
                        <Players playerConfig={playerConfig} />
                      )}
                    </div>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  sx={{
                    border: '1px solid #ccc',
                    borderRadius: '16px',
                    backgroundColor: 'white',
                    height: '70vh',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#1F1B13',
                      fontSize: '22px',
                      padding: '16px',
                      flexShrink: 0,
                    }}
                    variant="h6"
                    color="primary"
                  >
                    Content Details
                  </Typography>

                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      padding: '0 16px 16px 16px',
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          fontWeight: '600',
                          color: '#969088',
                          fontSize: '12px',
                          mb: '4px',
                        }}
                      >
                        Name:
                      </Box>
                      <Box
                        sx={{
                          fontWeight: '400',
                          color: '#4D4639',
                          fontSize: '16px',
                        }}
                      >
                        {contentDetails.name}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          fontWeight: '600',
                          color: '#969088',
                          fontSize: '12px',
                          mb: '4px',
                        }}
                      >
                        Creator:
                      </Box>
                      <Box
                        sx={{
                          fontWeight: '400',
                          color: '#4D4639',
                          fontSize: '16px',
                        }}
                      >
                        {contentDetails.creator}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          fontWeight: '600',
                          color: '#969088',
                          fontSize: '12px',
                          mb: '4px',
                        }}
                      >
                        Description:
                      </Box>
                      <Box
                        sx={{
                          fontWeight: '400',
                          color: '#4D4639',
                          fontSize: '16px',
                        }}
                      >
                        {contentDetails.description}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          fontWeight: '600',
                          color: '#969088',
                          fontSize: '12px',
                          mb: '4px',
                        }}
                      >
                        Primary Category:
                      </Box>
                      <Box
                        sx={{
                          fontWeight: '400',
                          color: '#4D4639',
                          fontSize: '16px',
                        }}
                      >
                        {contentDetails.primaryCategory}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          fontWeight: '600',
                          color: '#969088',
                          fontSize: '12px',
                          mb: '4px',
                        }}
                      >
                        Created On:
                      </Box>
                      <Box
                        sx={{
                          fontWeight: '400',
                          color: '#4D4639',
                          fontSize: '16px',
                        }}
                      >
                        {formatDate(contentDetails.createdOn)}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          fontWeight: '600',
                          color: '#969088',
                          fontSize: '12px',
                          mb: '4px',
                        }}
                      >
                        Last Update:
                      </Box>
                      <Box
                        sx={{
                          fontWeight: '400',
                          color: '#4D4639',
                          fontSize: '16px',
                        }}
                      >
                        {formatDate(contentDetails.lastUpdatedOn)}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {getLocalStoredUserRole() === Role.CCTA &&
              isDiscoverContent !== 'true' &&
              isReadOnly !== 'true' && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 2,
                    mb: 2,
                    padding: '8px',
                    borderRadius: '16px',
                  }}
                >
                  <Button
                    variant="outlined"
                    sx={{
                      color: 'var(--mui-palette-warning-100) !important',
                      border:
                        '1px solid var(--mui-palette-warning-100) !important',
                      fontSize: '14px !important',
                      fontWeight: '500 !important',
                      marginRight: 1,
                      minWidth: '120px',
                      borderRadius: '100px',
                      textTransform: 'capitalize',
                    }}
                    onClick={handleReject}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePublish}
                    sx={{ minWidth: '120px', textTransform: 'capitalize' }}
                    className="Request-btn"
                  >
                    Publish
                  </Button>
                </Box>
              )}
          </>
        ) : (
          <Typography>No content details available</Typography>
        )}

        <ConfirmActionPopup
          open={openConfirmationPopup}
          onClose={closePublishPopup}
          actionType={confirmationActionType}
          onConfirm={confirmPublishContent}
        />
        <ConfirmActionPopup
          open={openCommentPopup}
          onClose={closeCommentPopup}
          actionType={'reject'}
          onConfirm={handleSubmitComment}
        />

        {/* <ReviewCommentPopup
        open={openCommentPopup}
        onClose={closeCommentPopup}
        onSubmit={handleSubmitComment}
        title="Submit Your Comment"
      /> */}
      </Card>
    </>
  );
};

export default ReviewContentSubmissions;
