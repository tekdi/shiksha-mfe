import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Avatar, CircularProgress, Chip, useTheme, useMediaQuery, Menu, MenuItem, Snackbar, Alert, Button, Dialog, DialogContent } from '@mui/material';
import { 
  Favorite,
  FavoriteBorder, 
  Share, 
  MoreVert, 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff,
  Quiz as QuizIcon,
  Flag,
  NotInterested,
  Lock,
  ExpandMore,
  HelpOutline
} from '@mui/icons-material';
import SunbirdPlayer from '../../../../../libs/shared-lib/src/lib/SunbirdPlayer/SunbirdPlayer';

// Short Videos with real questionset do_ids from Sunbird API
const MOCK_VIDEOS = [
  {
    id: '1',
    assessmentId: 'do_21442278678232268813', // Real questionset do_id for Video 1
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    title: 'Newton\'s Laws of Motion',
    description: 'Understanding the basics of physics in 60 seconds!',
    author: 'Science Dept',
    likes: 1200,
    source: 'Sunbird',
    grade: 'Class 10',
    subject: 'Physics'
  },
  {
    id: '2',
    assessmentId: 'do_214486593249189888127', // Real questionset do_id for Video 2
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    title: 'Photosynthesis Explained',
    description: 'How plants make their own food.',
    author: 'Biology Hub',
    likes: 850,
    source: 'Diksha',
    grade: 'Class 9',
    subject: 'Biology'
  },
   {
    id: '3',
    assessmentId: 'do_214486593249189888127', // Real questionset do_id for Video 3
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    title: 'The Solar System',
    description: 'A quick tour of our neighborhood in space.',
    author: 'Space Academy',
    likes: 2100,
    source: 'YouTube',
    grade: 'Class 6',
    subject: 'Geography'
  }
];

const ShortVideoReel = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showAssessment, setShowAssessment] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(MOCK_VIDEOS[0].id);
    const [unlockedVideoIds, setUnlockedVideoIds] = useState<string[]>([]);

    // Scroll Handler to detect active video
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const scrollPosition = container.scrollTop;
        const itemHeight = container.clientHeight;
        
        const index = Math.round(scrollPosition / itemHeight);
        
        if (index !== activeIndex && index >= 0 && index < MOCK_VIDEOS.length) {
            setActiveIndex(index);
            setActiveVideoId(MOCK_VIDEOS[index].id);
        }
    }, [activeIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    // Handle postMessage events from TekdiQuML player
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (data && (data.eid === "SUMMARY" || data.eid === "END" || data.eid === "EXIT")) {
                console.log("🎯 Received Player Event via postMessage:", data);
                if (data.eid === "SUMMARY" && activeVideoId) {
                    setUnlockedVideoIds(prev => [...prev, activeVideoId]);
                }
                if (data.eid === "EXIT") {
                    setShowAssessment(false);
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [activeVideoId]);

    const handleVideoEnd = (videoId: string) => {
        console.log("Video ended:", videoId);
    };

    const handleCloseAssessment = () => {
        setShowAssessment(false);
    };

    const currentVideo = MOCK_VIDEOS.find(v => v.id === activeVideoId);

    return (
        <Box 
            sx={{ 
                height: { xs: 'calc(100vh - 140px)', md: '80vh' },
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box
                ref={containerRef}
                sx={{
                    height: '100%',
                    width: { xs: '100%', sm: '400px', md: '450px' },
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    scrollBehavior: 'smooth',
                    borderRadius: { xs: 0, md: '16px' },
                    boxShadow: { xs: 'none', md: '0 4px 20px rgba(0,0,0,0.1)' },
                    backgroundColor: '#000',
                }}
            >
                {MOCK_VIDEOS.map((video, index) => (
                    <VideoCard 
                        key={video.id} 
                        video={video} 
                        isActive={index === activeIndex}
                        onEnded={() => handleVideoEnd(video.id)}
                        onTakeQuiz={() => setShowAssessment(true)}
                        showAssessment={showAssessment}
                    />
                ))}
            </Box>

            {/* TekdiQuML Player Modal - Uses SunbirdPlayer with real do_id */}
            <Dialog
                open={showAssessment && activeVideoId !== null}
                onClose={handleCloseAssessment}
                fullWidth
                maxWidth={false}
                scroll="paper"
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                    },
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(2px)'
                    }
                }}
                PaperProps={{
                    sx: {
                        margin: '16px', // Give it some padding from screen edges
                        marginBottom: '24px', // Push it up further from the bottom
                        width: 'calc(100% - 32px)',
                        maxWidth: { xs: 'calc(100% - 32px)', sm: '400px', md: '450px' },
                        height: '35%', // Slightly more height for content
                        maxHeight: '35%',
                        borderRadius: '28px', // Fully rounded floating look
                        background: '#fff',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)', // More depth
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogContent sx={{ p: 0, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Header */}
                    <Box sx={{ 
                        p: 1.5, 
                        borderBottom: '1px solid rgba(0,0,0,0.05)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        flexShrink: 0
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" sx={{ color: '#E6873C', p: 0.5 }}>
                                <HelpOutline fontSize="small" />
                            </IconButton>
                            <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
                                {currentVideo?.title || "Quiz"}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleCloseAssessment} size="small" sx={{ p: 0.5 }}>
                            <ExpandMore />
                        </IconButton>
                    </Box>
                    
                    
                    {/* TekdiQuML Player via SunbirdPlayer */}
                    <Box sx={{ 
                        flex: 1, 
                        backgroundColor: '#fff', 
                        position: 'relative', 
                        overflow: 'auto',
                        minHeight: "40%" 
                    }}>
                        {currentVideo?.assessmentId && (
                            <SunbirdPlayer 
                                identifier={currentVideo.assessmentId} 
                                fromShortVideo={true}
                            />
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

interface VideoCardProps {
    video: typeof MOCK_VIDEOS[0];
    isActive: boolean;
    onEnded: () => void;
    onTakeQuiz: () => void;
    showAssessment: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isActive, onEnded, onTakeQuiz, showAssessment }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(video.likes);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => {
                if (videoRef.current) {
                    console.log("▶️ Playing video:", video.id);
                    const playPromise = videoRef.current.play();
                    if (playPromise !== undefined) {
                      playPromise
                        .then(() => {
                          setIsPlaying(true);
                        })
                        .catch((error) => {
                          console.log("Autoplay prevented:", error);
                          setIsPlaying(false);
                        });
                    }
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            if (videoRef.current) {
                console.log("⏸ Pausing video:", video.id, "due to isActive:", isActive);
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [isActive, video.id]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLiked) {
            setLikesCount(prev => prev - 1);
        } else {
            setLikesCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: `Check out this video: ${video.title}`,
                    url: video.url,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(video.url);
            setToastMessage("Link copied to clipboard!");
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (e: any) => {
        if (e) e.stopPropagation();
        setAnchorEl(null);
    };

    const handleMenuAction = (action: string) => {
        setAnchorEl(null);
        setToastMessage(`${action} action triggered`);
    };

    const formatLikes = (count: number) => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count;
    };

    return (
        <Box
            sx={{
                height: '100%',
                width: '100%',
                scrollSnapAlign: 'start',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#000'
            }}
            onClick={togglePlay}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={video.url}
                muted={isMuted}
                style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover'
                }}
                playsInline
                loop={false}
                onEnded={onEnded}
            />

            {/* Gradient Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    pointerEvents: 'none'
                }}
            />

            {/* Play/Pause Icon Overlay */}
            {isPlaying === false && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        borderRadius: '50%',
                        p: 2,
                        pointerEvents: 'none'
                    }}
                >
                    <PlayArrow sx={{ color: '#fff', fontSize: 40 }} />
                </Box>
            )}

            {/* Right Side Actions */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 100,
                    right: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center',
                    zIndex: 2
                }}
            >
                <IconButton onClick={handleLike} sx={{ color: isLiked ? '#f44336' : '#fff', flexDirection: 'column' }}>
                    {isLiked ? <Favorite sx={{ fontSize: 30 }} /> : <FavoriteBorder sx={{ fontSize: 30 }} />}
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff' }}>{formatLikes(likesCount)}</Typography>
                </IconButton>
                
                <IconButton onClick={handleShare} sx={{ color: '#fff', flexDirection: 'column' }}>
                    <Share sx={{ fontSize: 30 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Share</Typography>
                </IconButton>

                <IconButton onClick={handleMenuOpen} sx={{ color: '#fff' }}>
                    <MoreVert sx={{ fontSize: 30 }} />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuAction('Report'); }}>
                        <Flag fontSize="small" sx={{ mr: 1 }} /> Report
                    </MenuItem>
                    <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuAction('Not Interested'); }}>
                        <NotInterested fontSize="small" sx={{ mr: 1 }} /> Not Interested
                    </MenuItem>
                </Menu>

                <IconButton onClick={toggleMute} sx={{ color: '#fff' }}>
                    {isMuted ? <VolumeOff sx={{ fontSize: 30 }} /> : <VolumeUp sx={{ fontSize: 30 }} />}
                </IconButton>
            </Box>

            {/* Take a Quiz Button */}
            {video.assessmentId && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 120,
                        right: 16,
                        zIndex: 3,
                    }}
                >
                    <Button
                        variant="contained"
                        startIcon={<QuizIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('Take Quiz clicked for assessmentId:', video.assessmentId);
                            onTakeQuiz();
                        }}
                        sx={{
                            borderRadius: '20px',
                            backgroundColor: 'rgba(36, 35, 35, 0.9)',
                            color: '#fff',
                            fontWeight: 'bold',
                            textTransform: 'none',
                            px: 2,
                            py: 1,
                            '&:hover': {
                                backgroundColor: '#333232ff',
                            },
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                    >
                        Take a Quiz
                    </Button>
                </Box>
            )}

            {/* Bottom Info Section */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: 16,
                    right: 60,
                    color: '#fff',
                    zIndex: 2,
                    pointerEvents: 'none'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, border: '2px solid #fff' }} src={video.poster} />
                    <Typography variant="subtitle1" fontWeight="bold">
                        {video.author}
                    </Typography>
                     <Chip 
                        label={video.source} 
                        size="small" 
                        sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)', 
                            color: '#fff',
                            height: 20,
                            fontSize: '0.65rem'
                        }} 
                    />
                </Box>

                <Typography variant="body1" sx={{ mb: 1, maxWidth: '90%' }}>
                    {video.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }} noWrap>
                    {video.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                        label={video.grade} 
                        size="small" 
                        sx={{ backgroundColor: '#E6873C', color: '#fff', fontWeight: 'bold' }} 
                    />
                    <Chip 
                        label={video.subject} 
                        size="small" 
                        sx={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff' }} 
                    />
                </Box>
            </Box>

            <Snackbar
                open={!!toastMessage}
                autoHideDuration={3000}
                onClose={() => setToastMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setToastMessage(null)} severity="success" sx={{ width: '100%' }}>
                    {toastMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ShortVideoReel;
