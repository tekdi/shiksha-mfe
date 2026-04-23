import React, { useEffect, useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { getUserCertificates } from '../services/Certificate';
import { CommonCard, ContentItem, Layout } from '@shared-lib';
import AppConst from '../utils/AppConst/AppConst';

interface Certificate extends ContentItem {
  courseId: string;
  completedOn: string;
  duration: string;
}
const CertificatesPage = () => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      const response = await getUserCertificates({
        userId: localStorage.getItem('userId') || '',
        limit: 3,
        offset,
      });
      const { result } = response;
      if (result) {
        setCertificates((prev) => [...prev, ...result.data]);
      }
      setHasMoreData(response.result?.data.length > 0);
      setIsPageLoading(false);
    };
    fetchCertificates();
  }, [offset]);

  const handleLoadMore = () => {
    setOffset((prev) => prev + 3);
  };

  return (
    <Layout
      isLoadingChildren={isPageLoading}
      _topAppBar={{
        title: 'Shiksha: My Certificates',
        actionButtonLabel: 'Action',
      }}
      onlyHideElements={['footer']}
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {certificates?.map((item: any) => (
            <Grid key={item?.identifier} item xs={12} sm={6} md={4} lg={3}>
              <CommonCard
                minheight="100%"
                title={(item?.name || '').trim()}
                image={item?.posterImage && item?.posterImage !== 'undefined'
                  ? item?.posterImage
                  : `${AppConst.BASEPATH}/assests/images/image_ver.png`}
                content={item?.description || '-'}
                actions={item?.contentType}
                // subheader={item?.contentType}
                orientation="horizontal"
                item={item}
                TrackData={[]}
                type={'Course'} description={undefined}                // onClick={() => handleCardClick(item)}
              />
            </Grid>
          ))}
        </Grid>
        {hasMoreData && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 2,
            }}
          >
            <Button onClick={handleLoadMore}>Load More</Button>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default CertificatesPage;
