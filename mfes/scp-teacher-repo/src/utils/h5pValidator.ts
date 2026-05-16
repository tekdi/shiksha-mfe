export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the full H5P QuestionSet structure.
 */
export function validateH5PQuestionSet(content: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.questions || !Array.isArray(content.questions) || content.questions.length === 0) {
    errors.push("Question set must contain at least one question.");
    return { valid: false, errors, warnings };
  }

  content.questions.forEach((q: any, index: number) => {
    const prefix = `Question ${index + 1}: `;
    if (!q.library) {
      errors.push(`${prefix}Missing library field.`);
      return;
    }

    if (q.library.startsWith('H5P.MultiChoice')) {
      const qErrors = validateMultiChoice(q.params);
      errors.push(...qErrors.map(e => `${prefix}${e}`));
    } else if (q.library.startsWith('H5P.Blanks')) {
      const qErrors = validateBlanks(q.params);
      errors.push(...qErrors.map(e => `${prefix}${e}`));
    } else if (q.library.startsWith('H5P.DragText')) {
      const qErrors = validateDragText(q.params);
      errors.push(...qErrors.map(e => `${prefix}${e}`));
    } else {
      errors.push(`${prefix}Unknown or unsupported library type: ${q.library}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validation rules for H5P.MultiChoice 1.16
 */
function validateMultiChoice(params: any): string[] {
  const errors: string[] = [];
  
  if (!params.question || typeof params.question !== 'string' || params.question.trim() === '') {
    errors.push("Question text must be a non-empty string.");
  }

  if (!params.answers || !Array.isArray(params.answers) || params.answers.length < 2) {
    errors.push("Must have at least 2 answer options.");
  } else {
    let correctCount = 0;
    params.answers.forEach((ans: any, i: number) => {
      if (!ans.text || typeof ans.text !== 'string' || ans.text.trim() === '') {
        errors.push(`Answer ${i + 1} text is missing.`);
      }
      if (ans.correct === true) correctCount++;
      
      if (!ans.tipsAndFeedback || typeof ans.tipsAndFeedback.chosenFeedback !== 'string') {
        errors.push(`Answer ${i + 1} is missing feedback text.`);
      }
    });

    if (correctCount !== 1) {
      errors.push(`Exactly 1 answer must be marked correct (found ${correctCount}).`);
    }
  }

  if (!params.behaviour) {
    errors.push("Missing behaviour configuration.");
  } else {
    if (typeof params.behaviour.enableRetry !== 'boolean') {
      errors.push("Behaviour: enableRetry must be a boolean.");
    }
    const validTypes = ["auto", "single", "multi"];
    if (!validTypes.includes(params.behaviour.type)) {
      errors.push(`Behaviour: type must be one of ${validTypes.join(', ')}.`);
    }
  }

  return errors;
}

/**
 * Validation rules for H5P.Blanks 1.14
 */
function validateBlanks(params: any): string[] {
  const errors: string[] = [];

  if (!params.text || typeof params.text !== 'string' || params.text.trim() === '') {
    errors.push("Introductory text must be a non-empty string.");
  }

  if (!params.questions || !Array.isArray(params.questions) || params.questions.length < 1) {
    errors.push("Must have at least 1 fill-in-the-blank sentence.");
  } else {
    params.questions.forEach((q: any, i: number) => {
      if (!q || typeof q !== 'string' || !q.includes('*')) {
        errors.push(`Sentence ${i + 1} must contain at least one blank marker (e.g., *word*).`);
      }
    });
  }

  if (!params.behaviour || typeof params.behaviour.caseSensitive !== 'boolean') {
    errors.push("Behaviour: caseSensitive must be a boolean.");
  }

  return errors;
}

/**
 * Validation rules for H5P.DragText 1.10
 */
function validateDragText(params: any): string[] {
  const errors: string[] = [];

  if (!params.taskDescription || typeof params.taskDescription !== 'string' || params.taskDescription.trim() === '') {
    errors.push("Task description must be a non-empty string.");
  }

  if (!params.textField || typeof params.textField !== 'string' || !params.textField.includes('*')) {
    errors.push("Text field must contain at least one draggable marker (e.g., *word*).");
  }

  if (!params.behaviour) {
    errors.push("Missing behaviour configuration.");
  }

  return errors;
}
