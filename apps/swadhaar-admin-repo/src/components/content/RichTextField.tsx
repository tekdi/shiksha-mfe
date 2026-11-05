import React, { useEffect, useRef } from 'react';
import { Box, Tooltip } from '@mui/material';
import { NEUTRAL } from '@/styles/customTheme';

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'P', 'BR', 'DIV']);
const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

/** Keeps only the formatting the editor produces (bold, italic, underline, lists, links); drops everything else */
export const sanitizeRichHtml = (html: string): string => {
  if (typeof window === 'undefined' || !html) return html || '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const clean = (node: Element) => {
    Array.from(node.children).forEach((child) => {
      clean(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }
      Array.from(child.attributes).forEach((attr) => {
        const keep = child.tagName === 'A' && attr.name === 'href' && SAFE_LINK.test(attr.value.trim());
        if (!keep) child.removeAttribute(attr.name);
      });
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
        if (!child.getAttribute('href')) child.replaceWith(...Array.from(child.childNodes));
      }
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
};

const isBlank = (html: string): boolean => {
  const probe = document.createElement('div');
  probe.innerHTML = html;
  return !probe.textContent?.trim() && !probe.querySelector('li');
};

const TOOLBAR_BUTTON_SX = {
  cursor: 'pointer',
  px: 0.6,
  py: 0.2,
  borderRadius: '3px',
  userSelect: 'none',
  '&:hover': { backgroundColor: '#EEEDE9', color: NEUTRAL.ink },
} as const;

interface RichTextFieldProps {
  /** HTML */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
  minHeight?: number;
}

/** Text box with a working B / I / U / List / Link toolbar; the value is sanitized HTML. */
export const RichTextField: React.FC<RichTextFieldProps> = ({ value, onChange, placeholder, id, minHeight = 96 }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Load the value into the editor, except while the user is typing in it (that would move the caret)
  useEffect(() => {
    const el = editorRef.current;
    if (el && document.activeElement !== el && el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = sanitizeRichHtml(el.innerHTML);
    onChange(isBlank(html) ? '' : html);
  };

  const run = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg); // NOSONAR: execCommand is the only built-in way to format editable text
    emit();
  };

  const addLink = () => {
    const selection = window.getSelection();
    const selected = selection?.toString() || '';
    const entered = window.prompt('Link address (https://…)', 'https://');
    const url = entered?.trim();
    if (!url) return;
    if (!SAFE_LINK.test(url)) {
      window.alert('Enter a link that starts with http://, https:// or mailto:');
      return;
    }
    if (selected) run('createLink', url);
    else run('insertHTML', `<a href="${url.replace(/"/g, '&quot;')}">${url.replace(/</g, '&lt;')}</a>`);
  };

  const buttons: Array<{ key: string; title: string; label: React.ReactNode; sx: object; action: () => void } | 'divider'> = [
    { key: 'b', title: 'Bold', label: 'B', sx: { fontWeight: 700, fontSize: '13px' }, action: () => run('bold') },
    { key: 'i', title: 'Italic', label: 'I', sx: { fontStyle: 'italic', fontSize: '13px' }, action: () => run('italic') },
    { key: 'u', title: 'Underline', label: 'U', sx: { textDecoration: 'underline', fontSize: '13px' }, action: () => run('underline') },
    'divider',
    { key: 'ul', title: 'Bulleted list', label: '• List', sx: { fontSize: '12px', fontWeight: 500 }, action: () => run('insertUnorderedList') },
    { key: 'a', title: 'Insert link', label: 'Link', sx: { fontSize: '12px', fontWeight: 500 }, action: addLink },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 0.8,
          backgroundColor: '#FAF9F6',
          border: '1px solid #BDB9B1',
          borderBottom: 'none',
          borderRadius: '6px 6px 0 0',
          color: '#6B6862',
        }}
      >
        {buttons.map((b) =>
          b === 'divider' ? (
            <Box key="divider" sx={{ width: '1px', height: 16, backgroundColor: '#D6D3CC' }} />
          ) : (
            <Tooltip key={b.key} title={b.title}>
              <Box
                component="span"
                role="button"
                aria-label={b.title}
                // mouse down must not take the focus (and the selection) away from the editor
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  b.action();
                }}
                sx={{ ...TOOLBAR_BUTTON_SX, ...b.sx }}
              >
                {b.label}
              </Box>
            </Tooltip>
          )
        )}
      </Box>
      <Box
        id={id}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e: React.ClipboardEvent) => {
          // Pasted text keeps no outside styling
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); // NOSONAR: see run()
        }}
        sx={{
          minHeight,
          maxHeight: 280,
          overflowY: 'auto',
          px: 1.5,
          py: 1.2,
          fontSize: '14px',
          lineHeight: 1.5,
          color: NEUTRAL.ink,
          backgroundColor: 'background.paper',
          border: '1px solid #BDB9B1',
          borderRadius: '0 0 6px 6px',
          outline: 'none',
          '&:focus': { borderColor: 'primary.main' },
          '&:empty::before': { content: 'attr(data-placeholder)', color: NEUTRAL.subtle, pointerEvents: 'none' },
          '& ul, & ol': { margin: '4px 0', paddingLeft: '22px' },
          '& a': { color: 'primary.main', textDecoration: 'underline' },
          '& p, & div': { margin: 0 },
        }}
      />
    </Box>
  );
};

export default RichTextField;
