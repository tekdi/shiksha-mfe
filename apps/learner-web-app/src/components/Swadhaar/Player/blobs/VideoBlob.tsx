'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

const PRIMARY = '#E6873C';

interface VideoBlobProps {
  name: string;
  contentUrl: string;
  mimeType?: string;
  posterImage?: string;
  initialProgress?: number;
  isCompleted?: boolean;
  onProgress?: (percentage: number) => void;
  onComplete: () => void;
  onLoadError?: () => void;
}

export const VideoBlob: React.FC<VideoBlobProps> = ({ 
  name, 
  contentUrl, 
  mimeType, 
  posterImage, 
  initialProgress,
  isCompleted,
  onProgress, 
  onComplete, 
  onLoadError 
}) => {
  const isYoutube = (mimeType || '').toLowerCase() === 'video/x-youtube' || 
                    contentUrl.includes('youtube.com') || 
                    contentUrl.includes('youtu.be');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(initialProgress || 0);
  const [completed, setCompleted] = useState(isCompleted || false);
  const completionTriggeredRef = useRef(isCompleted || false);
  const lastReportedProgressRef = useRef(initialProgress || 0);
  const maxTimeWatchedRef = useRef(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (initialProgress !== undefined) {
      // Only set progress if it's greater than current to avoid resetting to 0 during sync
      setProgress(prev => Math.max(prev, initialProgress));
      
      lastReportedProgressRef.current = Math.max(lastReportedProgressRef.current, initialProgress);
      // Also update maxTimeWatched if duration is already known
      const dur = isYoutube ? 0 : videoRef.current?.duration;
      if (dur && dur > 0) {
        maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, (initialProgress / 100) * dur);
      }
    }
  }, [initialProgress, isYoutube]);

  useEffect(() => {
    if (isCompleted) {
      setCompleted(true);
      completionTriggeredRef.current = true;
    }
  }, [isCompleted]);


  const getYoutubeEmbedUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) 
        return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/embed/')) return url;
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : '';
      }
    } catch { }
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
    return '';
  };

  const handlePlay = () => {
    if (!contentUrl) { setError(true); return; }
    setPlaying(true);
    if (!isYoutube) {
      videoRef.current?.play().catch(() => { setError(true); setPlaying(false); });
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      // ✅ Restrict forward seeking
      if (!isInitializedRef.current && video.duration > 0) {
        const initialTime = (initialProgress || 0) / 100 * video.duration;
        maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, initialTime);
        isInitializedRef.current = true;
      }

      maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, video.currentTime);

      const percent = (video.currentTime / video.duration) * 100;
      setProgress(percent);

      // Report progress only if it's an increment to avoid jitters/resets
      if (percent > lastReportedProgressRef.current + 1) {
        lastReportedProgressRef.current = percent;
        onProgress?.(Math.round(percent));
      }
      
      // Mark as complete when 95% or more watched
      if (percent >= 95 && !completionTriggeredRef.current) {
        completionTriggeredRef.current = true;
        setCompleted(true);
        onComplete();
      }
    }
  };

  const handleVideoEnded = () => {
    if (!completionTriggeredRef.current) {
      completionTriggeredRef.current = true;
      setCompleted(true);
      onComplete();
    }
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // YouTube API support
  useEffect(() => {
    if (!isYoutube || !playing) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // YouTube Player API events
        if (data?.event === 'onStateChange') {
          // 0 = ended
          if (data?.info === 0 && !completionTriggeredRef.current) {
            console.log('[YouTube] Video Ended');
            completionTriggeredRef.current = true;
            setCompleted(true);
            setProgress(100);
            onProgress?.(100);
            onComplete();
          }
          // 1 = playing
          if (data?.info === 1) {
            setPlaying(true);
          }
        }

        // infoDelivery carries the current time and duration
        if (data?.event === 'infoDelivery' && data?.info) {
          const { currentTime, duration } = data.info;
          if (currentTime !== undefined && duration !== undefined && duration > 0) {
            // ✅ Restrict forward seeking
            if (!isInitializedRef.current) {
              const initialTime = (initialProgress || 0) / 100 * duration;
              maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, initialTime);
              isInitializedRef.current = true;
            }

            maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, currentTime);

            const percent = (currentTime / duration) * 100;
            setProgress(percent);
            
            // Throttled progress reporting - only allow increments
            if (percent > lastReportedProgressRef.current + 1) {
              lastReportedProgressRef.current = percent;
              onProgress?.(Math.round(percent));
            }

            // Auto-complete if near the end
            if (percent >= 95 && !completionTriggeredRef.current) {
              console.log('[YouTube] Progress >= 95%');
              completionTriggeredRef.current = true;
              setCompleted(true);
              onComplete();
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    
    // Send "listening" message to bootstrap API events
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [isYoutube, playing, onComplete, onProgress]);

  const youtubeEmbedUrl = getYoutubeEmbedUrl(contentUrl);

  if (error) {
    return (
      <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', bgcolor: '#fff', mb: 2 }}>
        <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>Video</Typography>
        </Box>
        <Box sx={{ bgcolor: '#0B1426', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' }}>
            Video could not be loaded. Please try again later.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', bgcolor: '#fff', mb: 2 }}>
      <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>Video Lesson</Typography>
        {completed && <CheckCircleRoundedIcon sx={{ color: '#4CAF50', fontSize: 20 }} />}
      </Box>
      
      <Box sx={{ bgcolor: '#0B1426', position: 'relative', minHeight: 200 }}>
        {isYoutube ? (
          playing ? (
            <iframe 
              ref={iframeRef}
              src={`${youtubeEmbedUrl}?autoplay=1&rel=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`} 
              title={name} 
              style={{ width: '100%', aspectRatio: '16 / 9', border: 'none' }} 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
            />
          ) : (
            <Box 
              onClick={handlePlay} 
              sx={{ 
                width: '100%', aspectRatio: '16 / 9', 
                backgroundImage: posterImage ? `url(${posterImage})` : 'none', 
                backgroundSize: 'cover', 
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box sx={{ 
                width: 56, height: 56, borderRadius: '50%', bgcolor: PRIMARY, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(230,135,60,0.4)'
              }}>
                <PlayArrowRoundedIcon sx={{ color: '#fff', fontSize: 32 }} />
              </Box>
            </Box>
          )
        ) : (
          <video 
            ref={videoRef} 
            src={contentUrl} 
            poster={posterImage} 
            style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} 
            controls={playing} 
            onEnded={handleVideoEnded} 
            onTimeUpdate={handleTimeUpdate} 
            onPlay={() => setPlaying(true)} 
            onError={() => { setError(true); onLoadError?.(); }} 
            preload="metadata" 
          />
        )}
        
        {!playing && !isYoutube && (
          <Box 
            onClick={handlePlay} 
            sx={{ 
              position: 'absolute', inset: 0, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', bgcolor: 'rgba(0,0,0,0.3)'
            }}
          >
            <Box sx={{ 
              width: 56, height: 56, borderRadius: '50%', bgcolor: PRIMARY, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(230,135,60,0.4)'
            }}>
              <PlayArrowRoundedIcon sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
          </Box>
        )}
      </Box>
      
      {progress > 0 && progress < 95 && !isCompleted && !completed && (
        <Box sx={{ px: 2, py: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: PRIMARY } }}
          />
          <Typography sx={{ fontSize: 11, color: '#6B7280', mt: 0.5, textAlign: 'center' }}>
            {Math.round(progress)}% watched
          </Typography>
        </Box>
      )}
      
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{name}</Typography>
      </Box>
    </Box>
  );
};
