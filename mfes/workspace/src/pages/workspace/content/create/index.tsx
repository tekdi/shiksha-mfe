import React, { useEffect, useState } from 'react';
import Layout from '../../../../components/Layout';
import { Typography, Box, useTheme, Paper, Grid } from '@mui/material';
import { useRouter } from 'next/router';
import {
  createCourse,
  createQuestionSet,
  createResourceContent,
} from '../../../../services/ContentService';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import WorkspaceText from '../../../../components/WorkspaceText';
import { getLocalStoredUserId } from '../../../../services/LocalStorageService';
import useTenantConfig from '../../../../hooks/useTenantConfig';
import WorkspaceHeader from '../../../../components/WorkspaceHeader';
import Cookies from 'js-cookie';
import TenantSetup from '../../../../components/TenantSetup';

const CreatePage = () => {
  const { tenantConfig, isLoading, error } = useTenantConfig();
  const theme = useTheme();
  const [selectedKey, setSelectedKey] = useState('create');
  const [showHeader, setShowHeader] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('token');
      const userId = getLocalStoredUserId();

      // Check cookies first, then localStorage for showHeader
      let headerValue = Cookies.get('showHeader');
      if (!headerValue) {
        const localStorageValue = localStorage.getItem('showHeader');
        if (localStorageValue) {
          headerValue = localStorageValue;
          // Migrate to cookies if found in localStorage
          Cookies.set('showHeader', localStorageValue, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          console.log('Migrated showHeader from localStorage to cookies');
        }
      }

      setShowHeader(headerValue === 'true');

      if (token && userId) {
        document.cookie = `authToken=${token}; path=/; secure; SameSite=Strict`;
        document.cookie = `userId=${userId}; path=/; secure; SameSite=Strict`;
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      const response = await createQuestionSet(
        tenantConfig?.COLLECTION_FRAMEWORK || ''
      );
      console.log('Question set created successfully:', response);

      const identifier = response?.result?.identifier;
      
      // Set contentMode to 'edit' for new content creation
      Cookies.set('contentMode', 'edit');
      
      router.push({
        pathname: `/editor`,
        query: { identifier },
      });
    } catch (error) {
      console.error('Error creating question set:', error);
    }
  };

  const openEditor = () => {
    fetchData();
  };

  const fetchCollectionData = async () => {
    try {
      const userId = getLocalStoredUserId();
      if (!userId) return;
      const response = await createCourse(
        userId,
        tenantConfig?.CHANNEL_ID || '',
        tenantConfig?.CONTENT_FRAMEWORK || '',
        tenantConfig?.COLLECTION_FRAMEWORK || ''
      );
      console.log('Course set created successfully:', response);

      const identifier = response?.result?.identifier;
      
      // Set contentMode to 'edit' for new content creation
      Cookies.set('contentMode', 'edit');
      
      router.push({
        pathname: `/collection`,
        query: { identifier },
      });
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const openCollectionEditor = () => {
    fetchCollectionData();
  };

  const fetchResourceContentData = async (contentType: string) => {
    try {
      const userId = getLocalStoredUserId();
      if (!userId) return;
      const response = await createResourceContent(
        userId,
        contentType,
        tenantConfig?.CHANNEL_ID || '',
        tenantConfig?.CONTENT_FRAMEWORK || ''
      );
      console.log('Resource created successfully:', response);

      const identifier = response?.result?.identifier;
      router.push({
        pathname: `/resource-editor`,
        query: { identifier },
      });
    } catch (error) {
      console.error('Error creating Resource:', error);
    }
  };

  const openResourceEditor = () => {
    fetchResourceContentData('Resource');
  };

  const openCourseAssessmentEditor = () => {
    fetchResourceContentData('SelfAssess');
  };

  const cardData = [
    {
      title: 'New Question Set',
      description: 'Create assessments, question banks, quizzes, etc.',
      icon: <QuizOutlinedIcon fontSize="large" />,
      onClick: openEditor,
    },
    {
      title: 'New Course',
      description: ' Create courses by defining content, assessments, etc',
      icon: <SchoolOutlinedIcon fontSize="large" />,
      onClick: openCollectionEditor,
    },
    {
      title: 'New Content',
      description: 'Create new documents, PDF, video, HTML, H5P, etc.',
      icon: <VideoLibraryOutlinedIcon fontSize="large" />,
      onClick: () => {
        sessionStorage.setItem('previousPage', window.location.href);
        // Set contentMode to 'edit' for new content creation
        Cookies.set('contentMode', 'edit');
        router.push('/upload-editor');
      },
    },
    {
      title: 'Create New Large Content', // Added "Create" to the title
      description: 'Create videos and documents larger than 150mb', // Updated description
      icon: <img src={'/150+.png'} alt="large-video" height={35} width={70} />,
      onClick: () => {
        sessionStorage.setItem('previousPage', window.location.href); // No change needed
        // Set contentMode to 'edit' for new content creation
        Cookies.set('contentMode', 'edit');
        router.push({
          pathname: '/upload-editor',
          query: { editorforlargecontent: 'true' }, // No change needed
        }); // Removed an extra comma
      },
    }
    // {
    //   title: 'New Resource',
    //   description:
    //     ' Create different resource like story, game, activity, audio, video using the inbuild authoring tools.',
    //   icon: <SchoolOutlinedIcon fontSize="large" />,
    //   onClick: openResourceEditor,
    // },
    // {
    //   title: 'Course Assessment',
    //   description:
    //     'Create assessments for courses using the in-built authoring tools',
    //   icon: <SchoolOutlinedIcon fontSize="large" />,
    //   onClick: openCourseAssessmentEditor,
    // },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <>
        {showHeader && <WorkspaceHeader />}
        <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
          <Box sx={{ padding: '20px', textAlign: 'center' }}>
            <Typography>Loading tenant configuration...</Typography>
          </Box>
        </Layout>
      </>
    );
  }

  // Show error state with tenant setup
  if (error) {
    return (
      <>
        {showHeader && <WorkspaceHeader />}
        <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
          <TenantSetup />
        </Layout>
      </>
    );
  }

  return (
    <>
      {showHeader && <WorkspaceHeader />}
      <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
        <WorkspaceText />

        {/* Outer box for "Create new content" heading and cards */}
        <Box
          sx={{
            background: 'linear-gradient(to bottom, white, #F8EFDA)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: theme.shadows[3],
          }}
          m={3} // Margin around the box for spacing
        >
          <Typography
            variant="h4"
            sx={{ mb: 2 }}
            fontSize={'16px'}
            fontWeight={600}
          >
            Create new content
          </Typography>

          <Box
            display="flex"
            gap="1rem"
            justifyContent="flex-start"
            flexWrap="wrap"
          >
            <Grid container spacing={2}>
              {cardData.map((card, index) => (
                <Grid item xs={12} sm={6} md={6} lg={6} xl={6} key={index}>
                  <Paper
                    key={index}
                    elevation={3}
                    onClick={card.onClick}
                    sx={{
                      padding: '1rem',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      flex: '1 1 180px',
                      // maxWidth: "220px",
                      // minHeight: "114px",
                      border: 'solid 1px #D0C5B4',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                    className="create-card"
                  >
                    {card?.icon}
                    <Typography
                      className="one-line-text"
                      variant="h3"
                      sx={{ mt: 1, fontWeight: 'bold', fontSize: '14px' }}
                    >
                      {card?.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="two-line-text"
                      color="textSecondary"
                      sx={{ mt: 1, mb: 0 }}
                    >
                      {card?.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Layout>
    </>
  );
};

export default CreatePage;
