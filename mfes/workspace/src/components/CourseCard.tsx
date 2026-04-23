/* eslint-disable @nx/enforce-module-boundaries */
import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { Status } from '@/utils/app.constant';
import { MIME_TYPE } from '@workspace/utils/app.config';
import router from 'next/router';
import { deleteContent } from '@workspace/services/ContentService';

interface ContentCardProps {
  title: string;
  description?: string;
  type: string;
  imageUrl?: string;
  status: string;
  identifier?: string;
  mimeType?: string;
  mode?: string;
  onDelete?: () => void;
}

const CourseCard: React.FC<ContentCardProps> = ({
  title,
  description,
  type,
  imageUrl,
  status,
  identifier,
  mimeType,
  mode,
  onDelete,
}) => {
  const theme = useTheme<any>();

  const onContentClick = () => {
    console.log('onContentClick ');
    console.log('mimeType 47', mimeType);
    if (mimeType === MIME_TYPE.QUESTIONSET_MIME_TYPE) {
      router.push({ pathname: `/editor`, query: { identifier, mode } });
    } else if (
      mimeType &&
      MIME_TYPE.GENERIC_MIME_TYPE.includes(mimeType) &&
      mode === 'review'
    ) {
      sessionStorage.setItem('previousPage', window.location.href);
      router.push({
        pathname: `/workspace/content/review`,
        query: { identifier, mode },
      });
    } else if (
      mimeType &&
      MIME_TYPE.GENERIC_MIME_TYPE.includes(mimeType) &&
      mode !== 'review'
    ) {
      sessionStorage.setItem('previousPage', window.location.href);
      router.push({ pathname: `/upload-editor`, query: { identifier } });
    } else if (
      mimeType &&
      MIME_TYPE.COURSE_MIME_TYPE.includes(mimeType) &&
      mode !== 'review'
    ) {
      router.push({ pathname: `/collection`, query: { identifier } });
    } else if (
      mimeType &&
      MIME_TYPE.ECML_MIME_TYPE.includes(mimeType) &&
      mode !== 'review'
    ) {
      router.push({ pathname: `/resource-editor`, query: { identifier } });
    }
  };

  const handleDeleteClick = async () => {
    if (identifier && mimeType) {
      try {
        await deleteContent(identifier, mimeType);
        console.log(`Deleted item with identifier - ${identifier}`);
        if (onDelete) {
          onDelete();
        }
      } catch (error) {
        console.error('Failed to delete content:', error);
      }
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '250px',
        borderRight: 'unset !important',
      }}
    >
      <Box position="relative" onClick={onContentClick}>
        <CardMedia
          component="div"
          sx={{
            height: 140,
            backgroundColor: theme.palette.info.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={title} height={'100%'} width={'100%'} />
          ) : (
            <ImageIcon fontSize="large" />
          )}
        </CardMedia>

        <Chip
          label={type}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: theme.palette.warning['100'],
            color: theme.palette.warning['A700'],
          }}
        />
      </Box>
      <CardContent sx={{ flex: 1 }} onClick={onContentClick}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      {(status === Status.DRAFT || status === Status.LIVE) && (
        <CardActions disableSpacing>
          <Box display="flex" justifyContent="flex-end" width="100%">
            <IconButton aria-label="delete" onClick={handleDeleteClick}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardActions>
      )}
    </Card>
  );
};

export default CourseCard;
