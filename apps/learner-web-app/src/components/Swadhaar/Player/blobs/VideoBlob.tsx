'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
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
  const durationRef = useRef<number>(0);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWatchedTimeRef = useRef(0);
  const seekInProgressRef = useRef(false);
  const pendingSeekProgressRef = useRef<number | null>(null);

  // Sync with props
  useEffect(() => {
    if (initialProgress !== undefined && initialProgress > 0) {
      setProgress(prev => Math.max(prev, initialProgress));
      lastReportedProgressRef.current = Math.max(lastReportedProgressRef.current, initialProgress);
      
      // If duration is already known, update maxTimeWatchedRef
      if (durationRef.current > 0) {
        const watchedTime = (initialProgress / 100) * durationRef.current;
        maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, watchedTime);
        lastWatchedTimeRef.current = videoRef.current ? videoRef.current.currentTime : watchedTime;
      }
    }
  }, [initialProgress, isYoutube]);

  useEffect(() => {
    if (isCompleted) {
      setCompleted(true);
      completionTriggeredRef.current = true;
      setProgress(100);
      lastReportedProgressRef.current = 100;
    }
  }, [isCompleted]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && isFinite(dur) && dur > 0) {
        durationRef.current = dur;
        console.log('[VIDEO] Metadata loaded. Duration:', dur);
        
        // Initialize maxTimeWatchedRef based on initialProgress now that we have duration
        if (initialProgress !== undefined && initialProgress > 0 && !isInitializedRef.current) {
          const watchedTime = (initialProgress / 100) * dur;
          maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, watchedTime);
          lastWatchedTimeRef.current = watchedTime;
          isInitializedRef.current = true;
          console.log('[VIDEO] Initialized maxTimeWatched from progress:', initialProgress, '% ->', watchedTime, 's');
        }
      }
    }
  };

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

  const updateProgress = (currentTime: number, isSeek: boolean = false) => {
    if (!durationRef.current || completed || completionTriggeredRef.current) return;
    
    // Track forward progress (both playback and seeks)
    if (currentTime > maxTimeWatchedRef.current) {
      // If it's a seek, we allow progress to update but we don't allow it to trigger completion directly
      // unless it's a very small skip (less than 2 seconds)
      const isLargeForwardSeek = isSeek && (currentTime - maxTimeWatchedRef.current > 2);
      
      if (isLargeForwardSeek) {
        console.log('[VIDEO] Forward seek detected. Updating progress to:', currentTime);
        // Capping seek-based progress at 90% to prevent "skipping to end" completion
        const seekTargetProgress = (currentTime / durationRef.current) * 100;
        if (seekTargetProgress >= 95) {
           console.log('[VIDEO] Seek reached completion threshold - capping at 94% to require actual watch for completion');
           maxTimeWatchedRef.current = durationRef.current * 0.94;
        } else {
           maxTimeWatchedRef.current = currentTime;
        }
      } else {
        // Normal playback or small adjustment
        maxTimeWatchedRef.current = currentTime;
      }
      
      lastWatchedTimeRef.current = currentTime;
      
      const percent = (maxTimeWatchedRef.current / durationRef.current) * 100;
      const cappedPercent = Math.min(percent, 100);
      setProgress(cappedPercent);
      
      // Report progress to parent
      if (cappedPercent >= lastReportedProgressRef.current + 2 || cappedPercent >= 95) {
        const roundedPercent = Math.round(cappedPercent);
        lastReportedProgressRef.current = cappedPercent;
        console.log(`[VIDEO] Reporting progress to parent: ${roundedPercent}% (isSeek: ${isSeek})`);
        onProgress?.(roundedPercent);
      }
      
      // Check for completion (only for normal playback or very end of video)
      if (cappedPercent >= 95 && !completionTriggeredRef.current && !isLargeForwardSeek) {
        console.log('[VIDEO] Progress >= 95% via playback - marking complete');
        completionTriggeredRef.current = true;
        setCompleted(true);
        onProgress?.(100);
        onComplete();
      }
    } else {
      // Backward seek or watching already watched part - just update lastWatchedTime
      lastWatchedTimeRef.current = currentTime;
    }
  };

  const startWatchingInterval = () => {
    if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
    
    watchIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !playing || completed || completionTriggeredRef.current) return;
      
      const video = videoRef.current;
      if (!durationRef.current && video.duration && isFinite(video.duration)) {
        handleLoadedMetadata();
      }
      
      if (durationRef.current > 0 && !seekInProgressRef.current) {
        const currentTime = video.currentTime;
        updateProgress(currentTime, false);
      }
    }, 1000); // Check every second
  };

  const stopWatchingInterval = () => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
  };

  const handleSeeking = () => {
    seekInProgressRef.current = true;
    stopWatchingInterval();
  };

  const handleSeeked = () => {
    // Wait a moment for the seek to complete and video to stabilize
    setTimeout(() => {
      if (videoRef.current && playing && !completed && !completionTriggeredRef.current) {
        const seekTime = videoRef.current.currentTime;
        console.log('[VIDEO] Seek completed at:', seekTime);
        
        // Handle seek in progress logic
        updateProgress(seekTime, true);
        
        seekInProgressRef.current = false;
        startWatchingInterval();
      } else {
        seekInProgressRef.current = false;
      }
    }, 300);
  };

  const handleVideoEnded = () => {
    console.log('[VIDEO] Video ended event');
    stopWatchingInterval();
    if (!completionTriggeredRef.current) {
      // The 'ended' event is fired by the browser only when playback reaches the actual
      // end of the video — this is authoritative proof the user finished watching.
      // Even if seek-cap held maxTimeWatched at 94%, the user watched the remaining
      // portion normally to reach the end, so we always mark complete here.
      console.log('[VIDEO] Video reached natural end — marking complete');
      completionTriggeredRef.current = true;
      setCompleted(true);
      setProgress(100);
      onComplete();
    }
  };

  useEffect(() => {
    if (playing && !completed && !isYoutube) {
      startWatchingInterval();
    } else {
      stopWatchingInterval();
    }
    return () => stopWatchingInterval();
  }, [playing, completed, isYoutube]);

  // YouTube specific tracking with seek protection
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtubeWatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastYoutubeTimeRef = useRef(0);
  const lastReportedProgressInternalRef = useRef(0);

  useEffect(() => {
    if (!isYoutube || !playing || completed || completionTriggeredRef.current) {
      if (youtubeWatchIntervalRef.current) {
        clearInterval(youtubeWatchIntervalRef.current);
        youtubeWatchIntervalRef.current = null;
      }
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Log all messages for debugging
        if (data?.event !== 'infoDelivery') {
          console.log('[YOUTUBE_MSG] Received event:', data?.event, data);
        }

        if (data?.event === 'onStateChange') {
          console.log('[YOUTUBE_MSG] State changed to:', data?.info);
          if (data?.info === 0 && !completionTriggeredRef.current) {
            // YouTube state=0 means the video reached its natural end.
            // This is authoritative — always mark complete regardless of seek-cap.
            // The cap only prevents instant skip-to-end; watching through to the end is valid.
            console.log('[YOUTUBE] Video reached natural end — marking complete');
            completionTriggeredRef.current = true;
            setCompleted(true);
            setProgress(100);
            onComplete();
          }
        }

        if (data?.event === 'infoDelivery' && data?.info) {
          // If completion was already triggered, ignore all further infoDelivery messages.
          // Without this guard, YouTube keeps sending position updates after the video ends,
          // which would call onProgress(94) again and cause flicker in the parent UI.
          if (completionTriggeredRef.current) return;

          const { currentTime, duration } = data.info;
          if (currentTime !== undefined && duration !== undefined && duration > 0) {
            if (!durationRef.current) {
              durationRef.current = duration;
              if (initialProgress && initialProgress > 0 && !isInitializedRef.current) {
                const initialTime = (initialProgress / 100) * duration;
                maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, initialTime);
                lastYoutubeTimeRef.current = maxTimeWatchedRef.current;
                isInitializedRef.current = true;
              }
            }

            // Track forward progress
            if (currentTime > maxTimeWatchedRef.current) {
              const increment = currentTime - maxTimeWatchedRef.current;
              const isLargeSkip = increment > 5;

              // Near-end check: if currentTime is within 2% of the total duration,
              // the user has effectively finished watching — trigger completion directly.
              // This bypasses the skip-cap which would otherwise block completion at 94%.
              const isNearEnd = duration > 0 && currentTime >= duration * 0.98;
              if (isNearEnd && !completionTriggeredRef.current) {
                console.log('[YOUTUBE] currentTime near end — triggering completion');
                completionTriggeredRef.current = true;
                setCompleted(true);
                setProgress(100);
                onComplete();
                return;
              }

              if (isLargeSkip) {
                console.log('[YOUTUBE] Forward skip detected. Updating progress to:', currentTime);
                const skipPercent = (currentTime / duration) * 100;
                if (skipPercent >= 95) {
                   maxTimeWatchedRef.current = duration * 0.94;
                } else {
                   maxTimeWatchedRef.current = currentTime;
                }
              } else {
                maxTimeWatchedRef.current = currentTime;
              }
              
              lastYoutubeTimeRef.current = currentTime;
              const percent = (maxTimeWatchedRef.current / duration) * 100;
              const cappedPercent = Math.min(percent, 100);
              setProgress(cappedPercent);
              
              if (cappedPercent >= lastReportedProgressInternalRef.current + 2 || cappedPercent >= 95) {
                lastReportedProgressInternalRef.current = cappedPercent;
                const roundedPercent = Math.round(cappedPercent);
                console.log('[YOUTUBE] Reporting progress:', roundedPercent, '%');
                onProgress?.(roundedPercent);
              }
              
              // Only trigger complete for small increments (watching)
              if (cappedPercent >= 95 && !completionTriggeredRef.current && !isLargeSkip) {
                completionTriggeredRef.current = true;
                setCompleted(true);
                onComplete();
              }
            } else {
              // Backward seek or watching watched part
              lastYoutubeTimeRef.current = currentTime;
            }
          }
        }
      } catch (e) {
        console.error('[YOUTUBE] Message error:', e);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request time updates more frequently
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow && playing && !completionTriggeredRef.current) {
        // console.log('[YOUTUBE_POLL] Requesting current time');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'getCurrentTime' }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
      if (youtubeWatchIntervalRef.current) clearInterval(youtubeWatchIntervalRef.current);
    };
  }, [isYoutube, playing, completed, onComplete, onProgress, initialProgress]);

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
    <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: isDesktop ? 'none' : '1px solid #E5E7EB', bgcolor: isDesktop ? 'transparent' : '#fff', mb: isDesktop ? 0 : 2 }}>
      {!isDesktop && (
        <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>Video Lesson</Typography>
          {(completed || isCompleted) && <CheckCircleRoundedIcon sx={{ color: '#4CAF50', fontSize: 20 }} />}
        </Box>
      )}
      
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
            onSeeking={handleSeeking}
            onSeeked={handleSeeked}
            onLoadedMetadata={handleLoadedMetadata}
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
      
      {progress > 0 && progress < 100 && !isCompleted && !completed && (
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
      
      {!isDesktop && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{name}</Typography>
        </Box>
      )}
    </Box>
  );
};
