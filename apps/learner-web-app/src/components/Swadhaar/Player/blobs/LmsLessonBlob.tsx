'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { fetchSwadhaarAttempt, fetchSwadhaarLesson } from '@learner/utils/API/SwadhaarService';
import { SWADHAAR_BASE_URL } from '@learner/utils/API/SwadhaarAuthService';
import { VideoBlob } from './VideoBlob';
import { ImageBlob } from './ImageBlob';
import { TextCardBlob } from './TextCardBlob';
import { LmsTestBlob } from './LmsTestBlob';
import { TextLessonBlob } from './TextLessonBlob';

const PRIMARY = '#E6873C';
const YOUTUBE_ID_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/;
const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|ogg|m3u8)(\?|$)/i;
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|gif|svg|webp)(\?|$)/i;

export interface LmsLessonBlobProps {
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  attemptId?: string;
  name: string;
  onProgress?: (percentage: number) => void;
  onComplete: () => void;
}

const youtubeEmbedUrl = (url: string): string | null => {
  const id = url.match(YOUTUBE_ID_REGEX)?.[1];
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
};

const Frame: React.FC<{ title: string; src: string; height?: number | string; onLoad?: () => void }> = ({ title, src, height = 420, onLoad }) => (
  <Box sx={{ width: '100%', height, bgcolor: '#000' }}>
    <iframe
      title={title}
      src={src}
      onLoad={onLoad}
      style={{ width: '100%', height: '100%', border: 0 }}
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
    />
  </Box>
);

const NoticeCard: React.FC<{ message: string; actionLabel?: string; href?: string; onAction?: () => void }> = ({
  message,
  actionLabel,
  href,
  onAction,
}) => (
  <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fff' }}>
    <Typography sx={{ fontSize: 14, color: '#4B5563', mb: href ? 2 : 0 }}>{message}</Typography>
    {href && (
      <Button
        variant="contained"
        href={href}
        onClick={onAction}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);

/**
 * Plays an LMS lesson. The lesson (GET lms-service/v1/lessons/:id) names its media by format/subFormat:
 * YouTube or file video, PDF documents, links and text. Quizzes and assessments need their own
 * question APIs and are not rendered here.
 */
export const LmsLessonBlob: React.FC<LmsLessonBlobProps> = ({ lessonId, courseId, moduleId, attemptId, name, onProgress, onComplete }) => {
  const [lesson, setLesson] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLesson(null);
    setError(false);
    fetchSwadhaarLesson(lessonId)
      .then((result) => !cancelled && setLesson(result))
      .catch(() => !cancelled && setError(true));
    if (attemptId) {
      fetchSwadhaarAttempt(attemptId)
        .then((result) => !cancelled && setAttempt(result))
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [lessonId, attemptId]);

  if (error) return <NoticeCard message="This lesson could not be loaded." />;
  if (!lesson) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 160 }}>
        <CircularProgress size={32} sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  // Uploaded files are stored as a server path (/uploads/...) that the LMS serves under /lms-service
  const mediaPath: string = (lesson.media?.path || '').trim();
  const url: string = mediaPath
    ? /^https?:\/\//i.test(mediaPath)
      ? mediaPath
      : `${SWADHAAR_BASE_URL}/lms-service/${mediaPath.replace(/^\/+/, '')}`
    : (lesson.media?.source || '').trim();
  const format: string = lesson.format;
  const subFormat: string = lesson.subFormat || '';
  const initialProgress = attempt?.completionPercentage ?? 0;
  const embed = youtubeEmbedUrl(url);

  if (format === 'test') {
    const testId: string = (lesson.media?.source || lesson.mediaContentSource || '').trim();
    if (!testId) return <NoticeCard message="This assessment has no test attached." />;
    return <LmsTestBlob testId={testId} lessonId={lessonId} courseId={courseId} moduleId={moduleId} onComplete={onComplete} />;
  }

  if (format === 'video') {
    // YouTube videos also go through VideoBlob: it listens to the player so progress and completion are reported
    return (
      <VideoBlob
        name={name}
        contentUrl={url}
        initialProgress={initialProgress}
        isCompleted={initialProgress >= 100}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );
  }

  if (format === 'document' || subFormat === 'pdf') {
    if (!url) return <NoticeCard message="This document has no file attached." />;
    return (
      <>
        <Frame title={name} src={url} height={520} onLoad={() => onComplete()} />
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
          <Button href={url} target="_blank" rel="noopener noreferrer" onClick={() => onComplete()} sx={{ textTransform: 'none', color: PRIMARY }}>
            Open in new tab
          </Button>
          <Button
            variant="contained"
            onClick={() => onComplete()}
            sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            Mark as read
          </Button>
        </Box>
      </>
    );
  }

  // text_and_media lessons (Intro, Hook, Concept, Analysis, Text blocks): the text is read in the app
  if (format === 'text_and_media' || subFormat.toLowerCase().startsWith('text')) {
    const isMediaFile = IMAGE_EXTENSION_REGEX.test(url) || VIDEO_EXTENSION_REGEX.test(url) || Boolean(embed);
    return (
      <TextLessonBlob
        name={name}
        html={lesson.description}
        linkUrl={url && !isMediaFile ? url : undefined}
        completed={initialProgress >= 100}
        onComplete={onComplete}
      />
    );
  }

  if (format === 'image' || IMAGE_EXTENSION_REGEX.test(url)) {
    return <ImageBlob name={name} contentUrl={url} description={lesson.description} onComplete={onComplete} />;
  }

  if (embed) return <Frame title={name} src={embed} />;
  if (VIDEO_EXTENSION_REGEX.test(url)) {
    return <VideoBlob name={name} contentUrl={url} onProgress={onProgress} onComplete={onComplete} />;
  }

  // text_and_media: the lesson text, with the linked page (external.url / discord.url) alongside
  return (
    <>
      {(lesson.description || !url) && (
        <TextCardBlob name={name} body={lesson.description} description={lesson.description} onComplete={onComplete} />
      )}
      {url && (
        <NoticeCard message="This lesson opens in a separate page." actionLabel="Open lesson" href={url} onAction={() => onComplete()} />
      )}
    </>
  );
};

export default LmsLessonBlob;
