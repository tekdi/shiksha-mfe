import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../../next-i18next.config.js';
import { getCourseHierarchy, CourseHierarchy, parseCourseName } from '@/services/CourseService';

export interface VideoItem {
  id: string;
  title: string;
  duration?: string;
  sourceUrl?: string;
}

export interface SectionBlock {
  id: string;
  type: 'INTRO' | 'HOOK' | 'VIDEO WATCH' | 'CONCEPT' | 'ANALYSIS' | 'TEXT' | 'IMAGE' | 'PDF';
  text?: string;
  videos?: VideoItem[];
  mediaUrl?: string;
  mediaName?: string;
}

const renameVideoInBlocks = (
  blocks: SectionBlock[],
  blockId: string,
  videoId: string,
  title: string
): SectionBlock[] =>
  blocks.map((b) => {
    if (b.id !== blockId) return b;
    return { ...b, videos: (b.videos || []).map((v) => (v.id === videoId ? { ...v, title } : v)) };
  });

export default function CreateSectionPage() {
  const router = useRouter();
  const { id } = router.query;
  const courseId = typeof id === 'string' ? id : '';

  const [course, setCourse] = useState<CourseHierarchy | null>(null);

  // Section Details Form
  const [title, setTitle] = useState<string>('Budgeting');
  const [duration, setDuration] = useState<string>('21');
  const [sectionPrefix, setSectionPrefix] = useState<string>('1.2');

  // Blocks in Section
  const [blocks, setBlocks] = useState<SectionBlock[]>([
    {
      id: 'blk-intro',
      type: 'INTRO',
      text: 'Now that you understand how financial planning helps households prepare for different needs and goals, the next step is to understand how families can manage their available income and expenses.',
    },
    {
      id: 'blk-hook',
      type: 'HOOK',
      text: 'How can a household save money if it does not know where its income is being spent?',
    },
    {
      id: 'blk-video',
      type: 'VIDEO WATCH',
      videos: [
        {
          id: 'vid-1',
          title: 'Life Cycle Needs | Episode 3 | Budgeting – Anita Ki Diary Ka Raaz',
          duration: '1:43 · YouTube link',
          sourceUrl: 'https://www.youtube.com/watch?v=anita-diary',
        },
        {
          id: 'vid-2',
          title: 'Understanding money in daily life',
          duration: '[duration] · YouTube link',
          sourceUrl: 'https://www.youtube.com/watch?v=money-daily-life',
        },
      ],
    },
    {
      id: 'blk-concept',
      type: 'CONCEPT',
      text: 'By recording household expenses regularly, it becomes easier to understand where the money is being spent…',
    },
    {
      id: 'blk-analysis',
      type: 'ANALYSIS',
      text: 'As a Field Trainer, it is important to help community members understand that budgeting does not require complicated calculations…',
    },
  ]);

  // Notifications
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    getCourseHierarchy(courseId)
      .then((data) => {
        setCourse(data);
        if (data.children && data.children.length > 0) {
          const nextIdx = (data.children.length + 1).toString();
          setSectionPrefix(`1.${nextIdx}`);
        }
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
      });
  }, [courseId]);

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleUpdateBlockText = (blockId: string, newText: string) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, text: newText } : b)));
  };

  const handleAddVideoToBlock = (blockId: string) => {
    const videoTitle = prompt('Enter video title:') || 'New Training Video';
    const newVideo: VideoItem = {
      id: `vid-${Date.now()}`,
      title: videoTitle,
      duration: '3:00 · YouTube link',
    };
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? { ...b, videos: [...(b.videos || []), newVideo] }
          : b
      )
    );
  };

  const handleEditVideoTitle = (blockId: string, video: VideoItem) => {
    const newTitle = prompt('Edit video title:', video.title);
    if (newTitle) {
      setBlocks(renameVideoInBlocks(blocks, blockId, video.id, newTitle));
    }
  };

  const handleRemoveVideo = (blockId: string, videoId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? { ...b, videos: (b.videos || []).filter((v) => v.id !== videoId) }
          : b
      )
    );
  };

  const handleAddBlockType = (type: SectionBlock['type']) => {
    let newBlock: SectionBlock;
    if (type === 'VIDEO WATCH') {
      newBlock = {
        id: `blk-${Date.now()}`,
        type,
        videos: [
          {
            id: `vid-${Date.now()}`,
            title: 'New Video Lecture',
            duration: '2:15 · Video link',
          },
        ],
      };
    } else {
      newBlock = {
        id: `blk-${Date.now()}`,
        type,
        text: `New ${type.toLowerCase()} content here...`,
      };
    }
    setBlocks([...blocks, newBlock]);
  };

  const handleSave = (asDraft = false) => {
    setSnackbarMessage(
      asDraft
        ? `Section "${title}" saved as draft successfully!`
        : `Section "${title}" published and added to course successfully!`
    );
    setTimeout(() => {
      const targetBase = router.pathname.startsWith('/courses') ? '/courses' : '/content/courses';
      router.push(`${targetBase}/${courseId}`);
    }, 1200);
  };

  const handleCancel = () => {
    const targetBase = router.pathname.startsWith('/courses') ? '/courses' : '/content/courses';
    router.push(`${targetBase}/${courseId}`);
  };

  const parsedName = parseCourseName(course?.title || course?.name || '');
  const courseDisplay = course?.title || (course?.courseCode ? `${course.courseCode} · ${course.cleanTitle}` : 'Course 1 · Introduction to Saving');
  const courseCode = parsedName.code || 'Course 1';
  const language = course?.detectedLanguage || 'Hindi';

  return (
    <Box sx={{ py: 1, backgroundColor: '#F4F3EF', minHeight: 'calc(100vh - 120px)', m: -2, p: 3 }}>
      {/* Top Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Link href="/content/courses" style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{
              color: '#6B6862',
              fontSize: '13px',
              fontWeight: 500,
              '&:hover': { color: '#E6873C' },
            }}
          >
            Learning
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
          /
        </Typography>
        <Link href="/content/courses" style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{
              color: '#6B6862',
              fontSize: '13px',
              fontWeight: 500,
              '&:hover': { color: '#E6873C' },
            }}
          >
            Courses
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
          /
        </Typography>
        <Link href={`/content/courses/${courseId}`} style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{
              color: '#6B6862',
              fontSize: '13px',
              fontWeight: 500,
              '&:hover': { color: '#E6873C' },
            }}
          >
            {courseCode}
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: '#1F1E1C', fontSize: '13px', fontWeight: 600 }}>
          {sectionPrefix} {title || 'Budgeting'}
        </Typography>
      </Box>

      {/* Main Header Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F1E1C', fontSize: '26px' }}>
            {sectionPrefix} · {title || 'Budgeting'}
          </Typography>
          <Chip
            label="Section"
            size="small"
            sx={{
              backgroundColor: '#EEEDE9',
              color: '#3D3B37',
              fontWeight: 500,
              fontSize: '12px',
              height: 24,
              borderRadius: '12px',
            }}
          />
          <Chip
            label="Course doc · section pattern"
            size="small"
            sx={{
              backgroundColor: '#E0E7FF',
              color: '#1E3A8A',
              fontWeight: 500,
              fontSize: '11px',
              fontFamily: 'monospace',
              height: 24,
              borderRadius: '4px',
            }}
          />
        </Box>

        {/* Action Buttons: Cancel, Save as draft, Save */}
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{
              borderColor: '#BDB9B1',
              color: '#1F1E1C',
              backgroundColor: '#FFFFFF',
              fontWeight: 500,
              fontSize: '14px',
              textTransform: 'none',
              borderRadius: '6px',
              height: 38,
              px: 2,
              '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="outlined"
            onClick={() => handleSave(true)}
            sx={{
              borderColor: '#BDB9B1',
              color: '#1F1E1C',
              backgroundColor: '#FFFFFF',
              fontWeight: 500,
              fontSize: '14px',
              textTransform: 'none',
              borderRadius: '6px',
              height: 38,
              px: 2,
              '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
            }}
          >
            Save as draft
          </Button>

          <Button
            variant="contained"
            onClick={() => handleSave(false)}
            sx={{
              backgroundColor: '#1F1E1C',
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '14px',
              textTransform: 'none',
              borderRadius: '6px',
              height: 38,
              px: 2.5,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#000000', boxShadow: 'none' },
            }}
          >
            Save
          </Button>
        </Box>
      </Box>

      {/* 2-Column Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Learning Content (2/3 width) */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C', mb: 0.5 }}>
              Learning content
            </Typography>

            {/* Blocks List */}
            {blocks.map((block, index) => {
              const isFirst = index === 0;
              const isLast = index === blocks.length - 1;

              return (
                <Box key={block.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  {/* Up / Down Reorder Arrows on left */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
                    <IconButton
                      size="small"
                      disabled={isFirst}
                      onClick={() => handleMoveBlock(index, 'up')}
                      aria-label={`Move ${block.type} block up`}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        border: '1px solid #BDB9B1',
                        backgroundColor: '#FFFFFF',
                        color: '#3D3B37',
                        p: 0,
                        '&:hover': { backgroundColor: '#F3F4F6' },
                        '&.Mui-disabled': { opacity: 0.3 },
                      }}
                    >
                      <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={isLast}
                      onClick={() => handleMoveBlock(index, 'down')}
                      aria-label={`Move ${block.type} block down`}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        border: '1px solid #BDB9B1',
                        backgroundColor: '#FFFFFF',
                        color: '#3D3B37',
                        p: 0,
                        '&:hover': { backgroundColor: '#F3F4F6' },
                        '&.Mui-disabled': { opacity: 0.3 },
                      }}
                    >
                      <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  {/* Block Card Container */}
                  <Paper
                    elevation={0}
                    sx={{
                      flexGrow: 1,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D6D3CC',
                      borderRadius: '10px',
                      p: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {/* Block Header: Type Badge + Remove Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: '11px',
                          letterSpacing: '0.06em',
                          color: '#3D3B37',
                          backgroundColor: '#EEEDE9',
                          borderRadius: '4px',
                          py: 0.5,
                          px: 1,
                        }}
                      >
                        {block.type}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => handleRemoveBlock(block.id)}
                        sx={{
                          color: '#9F1239',
                          width: 28,
                          height: 28,
                          '&:hover': { backgroundColor: '#FEE2E2' },
                        }}
                        title="Remove block"
                      >
                        <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>

                    {/* Block Content: Video Watch vs Rich Text Area */}
                    {block.type === 'VIDEO WATCH' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                        {(block.videos || []).map((video) => (
                          <Box
                            key={video.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 1.5,
                              p: '10px 14px',
                              border: '1px solid #ECEAE5',
                              borderRadius: '8px',
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 72,
                                  height: 42,
                                  borderRadius: '4px',
                                  backgroundColor: '#E2DFD8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#6B6862',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                VIDEO
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F1E1C' }}>
                                  {video.title}
                                </Typography>
                                <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                                  {video.duration || 'YouTube link'}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              <Tooltip title="Edit video">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditVideoTitle(block.id, video)}
                                  sx={{ color: '#6B6862', '&:hover': { color: '#1F1E1C' } }}
                                >
                                  <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove video">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveVideo(block.id, video.id)}
                                  sx={{ color: '#9F1239', '&:hover': { backgroundColor: '#FEE2E2' } }}
                                >
                                  <RemoveCircleOutlineIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ))}

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAddVideoToBlock(block.id)}
                          sx={{
                            alignSelf: 'flex-start',
                            borderColor: '#BDB9B1',
                            color: '#1F1E1C',
                            backgroundColor: '#FFFFFF',
                            textTransform: 'none',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            py: 0.5,
                            px: 1.5,
                            mt: 0.5,
                            '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
                          }}
                        >
                          + Add video
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Formatting Toolbar */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#6B6862',
                            py: 0.8,
                            px: 1.5,
                            border: '1px solid #ECEAE5',
                            borderBottom: 'none',
                            borderRadius: '6px 6px 0 0',
                            backgroundColor: '#FAF9F6',
                            userSelect: 'none',
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{ fontWeight: 700, fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
                          >
                            B
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontStyle: 'italic', fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
                          >
                            I
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ textDecoration: 'underline', fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
                          >
                            U
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
                          >
                            • List
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
                          >
                            Link
                          </Typography>
                        </Box>

                        <TextField
                          multiline
                          rows={2}
                          fullWidth
                          value={block.text || ''}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '0 0 6px 6px',
                              backgroundColor: '#FFFFFF',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              lineHeight: 1.5,
                              color: '#1F1E1C',
                              '& fieldset': { borderColor: '#BDB9B1' },
                              '&:hover fieldset': { borderColor: '#1F1E1C' },
                              '&.Mui-focused fieldset': { borderColor: '#1F1E1C' },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}

            {/* Bottom + Add Block Bar with Menu */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', pl: 5, mt: 1 }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: '#BDB9B1',
                  color: '#1F1E1C',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 500,
                  fontSize: '13px',
                  textTransform: 'none',
                  borderRadius: '6px',
                  height: 34,
                  px: 1.8,
                  '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
                }}
              >
                + Add block
              </Button>

              {/* Inline Block Type Selection Toolbar matching Prototype */}
              <Paper
                elevation={1}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  p: '6px 10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #BDB9B1',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(31,30,28,0.08)',
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('TEXT')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  Text
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('HOOK')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  Hook
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('CONCEPT')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  Concept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('ANALYSIS')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  Analysis
                </Button>

                <Box sx={{ width: 1, height: 20, backgroundColor: '#D6D3CC', mx: 0.5 }} />

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('VIDEO WATCH')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  + Video
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('PDF')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  + PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('IMAGE')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1,
                    '&:hover': { borderColor: '#1F1E1C' },
                  }}
                >
                  + Image
                </Button>
              </Paper>
            </Box>
          </Box>
        </Grid>

        {/* Right Column: Section details & Sidebar Cards (1/3 width) */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Card 1: Section Details */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6D3CC',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: '14px 20px', borderBottom: '1px solid #ECEAE5' }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Section details
                </Typography>
              </Box>

              <Box sx={{ p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Title */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Title *
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        backgroundColor: '#FFFFFF',
                        '& fieldset': { borderColor: '#BDB9B1' },
                        '&:hover fieldset': { borderColor: '#1F1E1C' },
                      },
                    }}
                  />
                </Box>

                {/* Duration */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Duration (min)
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        backgroundColor: '#FFFFFF',
                        '& fieldset': { borderColor: '#BDB9B1' },
                        '&:hover fieldset': { borderColor: '#1F1E1C' },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
                    From the course document
                  </Typography>
                </Box>

                {/* Course (Read-only) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Course
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={courseDisplay}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        backgroundColor: '#F9FAFB',
                        '& fieldset': { borderColor: '#D6D3CC' },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
                    Position set by reordering on the course page
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Card 2: Language */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6D3CC',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: '14px 20px',
                  borderBottom: '1px solid #ECEAE5',
                }}
              >
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Language
                </Typography>
                <Chip
                  label="DECISION"
                  size="small"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: '11px',
                    height: 20,
                    backgroundColor: '#DCFCE7',
                    color: '#14532D',
                    borderRadius: '4px',
                  }}
                />
              </Box>

              <Box sx={{ p: '14px 20px', fontSize: '14px', color: '#1F1E1C' }}>
                {language}{' '}
                <Typography component="span" sx={{ color: '#6B6862', fontSize: '13px' }}>
                  · set on the course
                </Typography>
              </Box>
            </Paper>

            {/* Card 3: Section Assessment */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6D3CC',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: '14px 20px', borderBottom: '1px solid #ECEAE5' }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Section assessment
                </Typography>
              </Box>

              <Box sx={{ p: '14px 20px' }}>
                <Typography variant="body2" sx={{ color: '#6B6862', fontSize: '13px', lineHeight: 1.5 }}>
                  Course 0 says “pass each section's assessment”; only course-level MCQs exist in the document.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar notification */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={2500}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', boxShadow: 3 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any, ['en', 'mr', 'hi'])),
    },
  };
};

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
