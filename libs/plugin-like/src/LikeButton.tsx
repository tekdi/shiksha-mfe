import React from 'react';
import { IconButton, IconButtonProps, Stack, Typography } from '@mui/material';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { useLike } from './useLike';

export interface LikeButtonProps extends IconButtonProps {
  contentId: string;
  userId: string;
  entityType?: string;
  initialLiked?: boolean;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  contentId,
  userId,
  entityType,
  initialLiked,
  onClick,
  ...props
}) => {
  const { liked, toggleLike } = useLike({ contentId, userId, entityType, initialLiked });

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const telemetryId = liked ? "content-like-button" : "content-unlike-button";
    console.log(`[LikeButton] Telemetry ID: ${telemetryId}`);
    toggleLike();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <IconButton onClick={handleToggle} color={liked ? 'primary' : 'default'} {...props}>
       <Stack direction="row" spacing={1} alignItems="center">
        {liked ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />}
        <Typography
          variant="body2"
          color={liked ? 'primary' : 'text.secondary'}
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
           Like
        </Typography>
      </Stack>
    </IconButton>
  );
};
