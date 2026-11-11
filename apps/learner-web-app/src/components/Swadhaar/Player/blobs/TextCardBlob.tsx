'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface TextCardBlobProps {
  name: string;
  body?: string;          // HTML string
  subheading?: string;    // orange label below title
  description?: string;
  onComplete: () => void;
}

export const TextCardBlob: React.FC<TextCardBlobProps> = ({ name, body, subheading, description, onComplete }) => {
  const [processedHtml, setProcessedHtml] = useState<string>('');
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const rawContent = body || description || '';
    // Strip solitary dots or hyphens from content (e.g. "<p>.</p>" or ".")
    const htmlContent = rawContent
      .replace(/^\s*<p[^>]*>\s*(\.|\-|·)\s*<\/p>/i, '')
      .replace(/^\s*(\.|\-|·)\s*(<br\s*\/?>)?/i, '')
      .trim();

    if (typeof window !== 'undefined' && htmlContent) {
      try {
        const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        const walk = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue || '';
            if (urlRegex.test(text) && node.parentNode?.nodeName !== 'A') {
              const span = document.createElement('span');
              span.innerHTML = text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #E6873C; text-decoration: underline;">${url}</a>`);
              node.parentNode?.replaceChild(span, node);
            }
          } else {
            Array.from(node.childNodes).forEach(walk);
          }
        };
        
        Array.from(doc.body.childNodes).forEach(walk);
        setProcessedHtml(doc.body.innerHTML);
      } catch (e) {
        setProcessedHtml(htmlContent);
      }
    } else {
      setProcessedHtml(htmlContent);
    }
  }, [body, description]);

  const cleanName = (name || '').trim();
  const showName = cleanName && cleanName !== '.' && cleanName !== '-' && cleanName !== '·';

  return (
    <Box
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        bgcolor: '#fff',
        mb: 2,
      }}
    >
      {/* Body */}
      <Box sx={{ p: 2.5 }}>
        {showName && (
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#1C2B4A', mb: subheading ? 0.5 : 1.5, fontFamily: 'Open Sans, sans-serif', lineHeight: 1.4 }}>
            {cleanName}
          </Typography>
        )}
        {subheading && (
          <Typography sx={{ fontSize: 12, color: '#E6873C', fontWeight: 700, mb: 1.5, fontFamily: 'Open Sans, sans-serif' }}>
            {subheading}
          </Typography>
        )}
        {processedHtml ? (
          <Box
            sx={{
              fontSize: 14,
              color: '#374151',
              lineHeight: 1.7,
              fontFamily: 'Open Sans, sans-serif',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontSize: '16px !important',
                fontWeight: '700 !important',
                color: '#1C2B4A !important',
                margin: '0 0 10px 0 !important',
                lineHeight: '1.4 !important',
                fontFamily: 'Open Sans, sans-serif !important',
              },
              '& p': { mb: 1.5 },
              '& ul': { pl: 2.5, mb: 1.5 },
              '& li': { mb: 0.75 },
              '& strong': { fontWeight: 700 },
            }}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        ) : null}
      </Box>
    </Box>
  );
};
