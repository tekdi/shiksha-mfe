import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CommonDialog from '@/components/common/CommonDialog';
import CommonTextField from '@/components/common/CommonTextField';

export interface CourseFaq {
  question: string;
  answer: string;
}

export type CourseLevelItem = 'faqs' | 'summary' | 'transition';

export interface CourseLevelValues {
  faqs: CourseFaq[];
  summary: string;
  transition: string;
}

interface CourseLevelItemDialogProps {
  item: CourseLevelItem | null;
  values: CourseLevelValues;
  title: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (item: CourseLevelItem, values: CourseLevelValues) => void;
}

type DraftFaq = CourseFaq & { key: string };
interface DraftValues extends Omit<CourseLevelValues, 'faqs'> {
  faqs: DraftFaq[];
}

let faqKeyCounter = 0;
// Stable key per row so React keeps each row's state when rows are removed
const toDraftFaq = (faq?: CourseFaq): DraftFaq => {
  faqKeyCounter += 1;
  return { question: faq?.question ?? '', answer: faq?.answer ?? '', key: `faq-${faqKeyCounter}` };
};

/** Edits one course-level item (FAQs, summary or transition); the page saves it on the course */
const CourseLevelItemDialog: React.FC<CourseLevelItemDialogProps> = ({
  item,
  values,
  title,
  saving,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<DraftValues>({ ...values, faqs: values.faqs.map((faq) => toDraftFaq(faq)) });

  useEffect(() => {
    if (!item) return;
    setDraft({
      ...values,
      faqs: values.faqs.length > 0 ? values.faqs.map((faq) => toDraftFaq(faq)) : [toDraftFaq()],
    });
    // Reset the draft only when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const updateFaq = (index: number, patch: Partial<CourseFaq>) =>
    setDraft((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)),
    }));

  const handleConfirm = () => {
    if (!item) return;
    onSave(item, {
      ...draft,
      faqs: draft.faqs
        .filter((faq) => faq.question.trim() && faq.answer.trim())
        .map(({ question, answer }) => ({ question, answer })),
    });
  };

  return (
    <CommonDialog
      open={Boolean(item)}
      onClose={onClose}
      title={title}
      onConfirm={handleConfirm}
      confirmLabel="Save"
      confirmDisabled={saving}
      maxWidth="sm"
      paperMaxWidth="640px"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {item === 'faqs' && (
          <>
            {draft.faqs.map((faq, index) => (
              <Box key={faq.key} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <CommonTextField
                    id={`${faq.key}-question`}
                    label={`Question ${index + 1}`}
                    value={faq.question}
                    onChange={(e) => updateFaq(index, { question: e.target.value })}
                  />
                  <CommonTextField
                    id={`${faq.key}-answer`}
                    label="Answer"
                    multiline
                    minRows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, { answer: e.target.value })}
                  />
                </Box>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    aria-label="Remove question"
                    onClick={() => setDraft((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            <Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setDraft((prev) => ({ ...prev, faqs: [...prev.faqs, toDraftFaq()] }))}
              >
                Add question
              </Button>
            </Box>
          </>
        )}
        {item === 'summary' && (
          <CommonTextField
            id="course-summary"
            label="Course summary"
            multiline
            minRows={5}
            value={draft.summary}
            onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
          />
        )}
        {item === 'transition' && (
          <CommonTextField
            id="course-transition"
            label="Next steps after completing this course"
            multiline
            minRows={5}
            value={draft.transition}
            onChange={(e) => setDraft((prev) => ({ ...prev, transition: e.target.value }))}
          />
        )}
      </Box>
    </CommonDialog>
  );
};

export default CourseLevelItemDialog;
