'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

const PRIMARY = '#E6873C';

const BLOCKED_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form'];

/** The lesson text is HTML written by an admin; scripts, event handlers and javascript: links are removed before it is shown. */
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined' || !html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  BLOCKED_TAGS.forEach((tag) => doc.querySelectorAll(tag).forEach((node) => node.remove()));
  doc.body.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
        node.removeAttribute(attr.name);
      }
    });
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return doc.body.innerHTML;
};

interface TextLessonBlobProps {
  name?: string;
  /** The lesson text, as HTML */
  html?: string;
  /** A page linked from the lesson (external.url) */
  linkUrl?: string;
  completed?: boolean;
  onComplete: () => void;
}

/**
 * Plays a text_and_media lesson (an Intro, Hook, Concept, Analysis or Text block of a section): the learner
 * reads the text and marks the lesson complete.
 */
export const TextLessonBlob: React.FC<TextLessonBlobProps> = ({ html, linkUrl, completed = false, onComplete }) => {
  const [done, setDone] = useState(completed);
  const body = useMemo(() => sanitizeHtml(html || ''), [html]);

  const handleComplete = () => {
    setDone(true);
    onComplete();
  };

  return (
    // The lesson player around this already shows the lesson title, so only the text and the button are shown here
    <Box sx={{ bgcolor: '#fff' }}>
      <Box sx={{ p: 2.5 }}>
        {body ? (
          <Box
            sx={{
              fontSize: 14,
              color: '#374151',
              lineHeight: 1.7,
              '& p': { mb: 1.5 },
              '& ul, & ol': { pl: 2.5, mb: 1.5 },
              '& li': { mb: 0.75 },
              '& strong': { fontWeight: 700 },
              '& a': { color: PRIMARY, textDecoration: 'underline' },
              '& img': { maxWidth: '100%', height: 'auto' },
            }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <Typography sx={{ fontSize: 14, color: '#6B7280' }}>This lesson has no text yet.</Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, gap: 1, flexWrap: 'wrap' }}>
          {linkUrl ? (
            <Button href={linkUrl} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', color: PRIMARY }}>
              Open linked page
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="contained"
            disabled={done}
            onClick={handleComplete}
            sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: PRIMARY } }}
          >
            {done ? 'Completed' : 'Mark as complete'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TextLessonBlob;
