/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @nx/enforce-module-boundaries */
import React, { useState } from 'react';
import { Table as KaTable } from 'ka-table';
import { DataType, EditingMode, SortingMode } from 'ka-table/enums';
import { Typography, useTheme, IconButton, Box, Grid } from '@mui/material';
import UpReviewTinyImage from '@mui/icons-material/LibraryBooks';
import 'ka-table/style.css';
import DeleteIcon from '@mui/icons-material/Delete';
import router from 'next/router';
import { MIME_TYPE } from '@workspace/utils/app.config';
import Image from 'next/image';
import ActionIcon from './ActionIcon';
import { Padding } from '@mui/icons-material';
import Cookies from 'js-cookie';

// Utility function to transform image URL from Azure blob to AWS S3
const transformImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '/logo.png';

  if (imageUrl.includes('https://sunbirdsaaspublic.blob.core.windows.net')) {
    // Handle double domain pattern
    if (
      imageUrl.includes(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net'
      )
    ) {
      // Extract everything after the second domain
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterSecondDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterSecondDomain.replace(
          /^content\/content\//,
          ''
        );
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with content/content prefix
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/content/${cleanPath}`;
      }
    } else {
      // Handle single domain pattern
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterDomain.replace(/^content\/content\//, '');
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with content/content prefix
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/content/${cleanPath}`;
      }
    }
  }

  return imageUrl;
};
interface CustomTableProps {
  data: any[]; // Define a more specific type for your data if needed
  columns: Array<{
    key: string;
    title: string;
    dataType: DataType;
  }>;
  handleDelete?: any;
  tableTitle?: string;
}

const KaTableComponent: React.FC<CustomTableProps> = ({
  data,
  columns,
  tableTitle,
}) => {
  const theme = useTheme<any>();
  const [open, setOpen] = useState(false);

  // Ensure data has unique identifiers for React keys
  const processedData = data?.map((item: any, index: number) => ({
    ...item,
    // Ensure each item has a unique identifier for React keys
    identifier: item.identifier || item.id || `row-${index}`,
  })) || [];

  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => setOpen(true);

  const openEditor = (content: any) => {
    const identifier = content?.identifier;
    let mode = content?.mode; // default mode from content, can be overwritten by tableTitle
    switch (tableTitle) {
      case 'draft':
        mode = !mode ? 'edit' : mode;
        Cookies.set('contentMode', mode);

        // Use draft-specific routing
        if (content?.mimeType === MIME_TYPE.QUESTIONSET_MIME_TYPE) {
          router.push({ pathname: `/editor`, query: { identifier } });
        } else if (
          content?.mimeType &&
          MIME_TYPE.GENERIC_MIME_TYPE.includes(content?.mimeType)
        ) {
          sessionStorage.setItem('previousPage', window.location.href);
          router.push({ pathname: `/upload-editor`, query: { identifier } });
        } else if (
          content?.mimeType &&
          MIME_TYPE.COLLECTION_MIME_TYPE.includes(content?.mimeType)
        ) {
          router.push({ pathname: `/collection`, query: { identifier } });
        } else if (
          content?.mimeType &&
          MIME_TYPE.ECML_MIME_TYPE.includes(content?.mimeType) &&
          mode !== 'review'
        ) {
          router.push({ pathname: `/resource-editor`, query: { identifier } });
        }
        return; // Exit early since draft has specific routing logic

      case 'publish':
      case 'discover-contents':
      case 'submitted':
        mode = 'read';
        break;

      case 'upForReview':
        mode = 'review';
        break;

      case 'all-content':
        mode =
          content?.status === 'Draft' || content?.status === 'Live'
            ? 'edit'
            : 'review';
        break;

      default:
        mode = mode || 'read';
        break;
    }

    // Save mode in cookies
    Cookies.set('contentMode', mode);
    // Generic routing for cases other than 'draft'
    if (content?.mimeType === MIME_TYPE.QUESTIONSET_MIME_TYPE) {
      router.push({ pathname: `/editor`, query: { identifier } });
    } else if (tableTitle === 'submitted') {
      content.contentType === 'Course'
        ? router.push({
            pathname: `/course-hierarchy/${identifier}`,
            query: { identifier, isReadOnly: true, previousPage: 'submitted' },
          })
        : router.push({
            pathname: `/workspace/content/review`,
            query: { identifier },
          });
    } else if (tableTitle === 'all-content' && mode === 'review') {
      content.contentType === 'Course'
        ? router.push({
            pathname: `/course-hierarchy/${identifier}`,
            query: {
              identifier,
              isReadOnly: true,
              previousPage: 'allContents',
            },
          })
        : router.push({
            pathname: `/workspace/content/review`,
            query: { identifier, isReadOnly: true },
          });
    } else if (tableTitle === 'discover-contents') {
      content.contentType === 'Course'
        ? router.push({
            pathname: `/course-hierarchy/${identifier}`,
            query: { identifier, previousPage: 'discover-contents' },
          })
        : router.push({
            pathname: `/workspace/content/review`,
            query: { identifier, isDiscoverContent: true },
          });
    } else if (
      content?.mimeType &&
      MIME_TYPE.GENERIC_MIME_TYPE.includes(content?.mimeType)
    ) {
      Cookies.set('contentCreatedBy', content?.createdBy);
      const pathname =
        tableTitle === 'upForReview'
          ? `/workspace/content/review`
          : `/upload-editor`;
      router.push({ pathname, query: { identifier } });
    } else if (
      content?.mimeType &&
      MIME_TYPE.ECML_MIME_TYPE.includes(content?.mimeType)
    ) {
      Cookies.set('contentCreatedBy', content?.createdBy);
      const pathname =
        tableTitle === 'upForReview'
          ? `/workspace/content/review`
          : `/resource-editor`;
      router.push({ pathname, query: { identifier } });
      // router.push({ pathname: `/resource-editor`, query: { identifier } });
    } else if (
      content?.mimeType &&
      MIME_TYPE.COLLECTION_MIME_TYPE.includes(content?.mimeType)
    ) {
      router.push({ pathname: `/collection`, query: { identifier } });
    }
  };
  return (
    <>
      <KaTable
        columns={columns}
        data={processedData}
        // editingMode={EditingMode.Cell}
        rowKeyField={'identifier'}
        sortingMode={SortingMode.Single}
        childComponents={{
          cellText: {
            content: (props) => {
              if (
                props.column.key === 'name' ||
                props.column.key === 'title_and_description'
              ) {
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => openEditor(props.rowData)}
                  >
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs={3} md={3} lg={3} xl={2}>
                        {props.rowData.image ? (
                          <Box
                            style={{
                              width: '60px',
                              height: '40px',
                              padding: '10px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              // background: '#F1E6D6'
                            }}
                          >
                            <img
                              src={transformImageUrl(props.rowData.image)}
                              alt="Image"
                              style={{
                                maxWidth: '100%',
                                height: 'auto%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                              }}
                              onError={(e) => {
                                e.currentTarget.src = '/logo.png';
                              }}
                              onLoad={() => {}}
                            />
                          </Box>
                        ) : props.column.key === 'name' ? (
                          <Box
                            style={{
                              width: '60px',
                              height: '40px',
                              padding: '10px',
                              borderRadius: '8px',

                              overflow: 'hidden',
                              // background: '#F1E6D6'
                            }}
                          >
                            <img
                              src={'/logo.png'}
                              height="25px"
                              alt="Image"
                              style={{
                                maxWidth: '100%',
                                height: 'auto%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </Box>
                        ) : (
                          <Box
                            style={{
                              width: '60px',
                              height: '40px',
                              padding: '10px', // Fixed casing
                              borderRadius: '8px',

                              overflow: 'hidden', // Ensures content doesn't overflow the box
                              // background: '#F1E6D6'
                            }}
                          >
                            <img
                              src={'/logo.png'}
                              height="25px"
                              alt="Image"
                              style={{
                                maxWidth: '100%',
                                height: 'auto',
                                objectFit: 'cover',
                                borderRadius: '8px',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={9} md={9} lg={9} xl={10}>
                        <div>
                          <div>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 500,
                                color: '#1F1B13',
                                fontSize: '14px',
                              }}
                              className="one-line-text"
                            >
                              {props.rowData.name}
                            </Typography>
                          </div>
                          <div>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 400,
                                color: '#635E57',
                                fontSize: '12px',
                              }}
                              className="two-line-text"
                              color={theme.palette.warning['A200']}
                            >
                              {props.column.key === 'name'
                                ? props.rowData.primaryCategory
                                : props.rowData.description}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                );
              } else if (props.column.key === 'status') {
                if (props.rowData.status === 'Draft') {
                  return (
                    <Typography
                      sx={{ fontSize: '14px', fontWeight: 500 }}
                      variant="body2"
                      className="one-line-text"
                      color={'#987100'}
                    >
                      {props.rowData.status}
                    </Typography>
                  );
                }
                if (props.rowData.status === 'Review') {
                  return (
                    <Typography
                      className="one-line-text"
                      sx={{ fontSize: '14px', fontWeight: 500 }}
                      variant="body2"
                      color={'#BA1A1A'}
                    >
                      {props.rowData.status}
                    </Typography>
                  );
                }
                if (props.rowData.status === 'Live') {
                  return (
                    <Typography
                      className="one-line-text"
                      sx={{ fontSize: '14px', fontWeight: 500 }}
                      variant="body2"
                      color={'#06A816'}
                    >
                      {props.rowData.status}
                    </Typography>
                  );
                }
              } else if (props.column.key === 'create-by') {
                if (props?.rowData?.creator || props?.rowData?.author)
                  return (
                    <Typography
                      sx={{ fontSize: '14px', fontWeight: 500 }}
                      variant="body2"
                      color={'#987100'}
                    >
                      {props?.rowData?.creator || props?.rowData?.author}
                    </Typography>
                  );
                else
                  return (
                    <Typography
                      sx={{ fontSize: '14px', fontWeight: 500 }}
                      variant="body2"
                      color={'#987100'}
                    >
                      -
                    </Typography>
                  );
              } else if (props.column.key === 'contentAction') {
                {
                  return (
                    <>
                      <ActionIcon rowData={props.rowData} />
                    </>
                  );
                }
              } else if (props.column.key === 'action') {
                return (
                  <Box onClick={handleOpen}>
                    <ActionIcon rowData={props.rowData} />
                  </Box>
                );
              } else if (props.column.key === 'contentType') {
                return (
                  <Typography
                    className="one-line-text"
                    sx={{ fontSize: '14px' }}
                    variant="body2"
                  >
                    {props?.rowData?.contentType}
                  </Typography>
                );
              } else if (props.column.key === 'lastUpdatedOn') {
                return (
                  <Typography
                    className="one-line-text"
                    sx={{ fontSize: '14px' }}
                    variant="body2"
                  >
                    {props?.rowData?.lastUpdatedOn}
                  </Typography>
                );
              }

              return props.children;
            },
          },
        }}
        noData={{
          text: 'No data found',
        }}
      />
    </>
  );
};

export default KaTableComponent;
