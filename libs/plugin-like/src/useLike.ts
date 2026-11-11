import { useState, useEffect } from 'react';
import { likeService } from './like.service';

interface UseLikeProps {
  contentId: string;
  userId: string;
  entityType?: string;
  initialLiked?: boolean;
}

export const useLike = ({ 
  contentId, 
  userId, 
  entityType = 'content',
  initialLiked = false 
}: UseLikeProps) => {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  const toggleLike = async () => {
    if (loading) return;

    const previousState = liked;
    // Optimistic update
    setLiked(!previousState);
    setLoading(true);

    try {
      await likeService.toggleLike(contentId, userId, previousState, entityType);
      // Success, state already updated optimistically
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on failure
      setLiked(previousState);
    } finally {
      setLoading(false);
    }
  };

  return { liked, loading, toggleLike };
};
