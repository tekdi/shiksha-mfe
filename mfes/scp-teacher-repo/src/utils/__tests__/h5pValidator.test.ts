import { validateH5PQuestionSet } from '../h5pValidator';

describe('validateH5PQuestionSet', () => {
  it('accepts a valid MCQ question set', () => {
    const content = {
      questions: [{
        library: 'H5P.MultiChoice 1.16',
        params: {
          question: '<p>What is 2+2?</p>',
          answers: [
            { text: '4', correct: true, tipsAndFeedback: { chosenFeedback: 'Correct!' } },
            { text: '5', correct: false, tipsAndFeedback: { chosenFeedback: 'Wrong' } },
          ],
          behaviour: { enableRetry: true, type: 'auto' }
        }
      }]
    };
    expect(validateH5PQuestionSet(content)).toEqual({ valid: true, errors: [], warnings: [] });
  });

  it('rejects MCQ with no correct answer', () => {
    const content = {
      questions: [{
        library: 'H5P.MultiChoice 1.16',
        params: {
          question: 'Q',
          answers: [
            { text: 'A', correct: false, tipsAndFeedback: { chosenFeedback: 'F' } },
            { text: 'B', correct: false, tipsAndFeedback: { chosenFeedback: 'F' } },
          ],
          behaviour: { enableRetry: true, type: 'auto' }
        }
      }]
    };
    const result = validateH5PQuestionSet(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question 1: Exactly 1 answer must be marked correct (found 0).');
  });

  it('rejects MCQ with only 1 answer option', () => {
    const content = {
      questions: [{
        library: 'H5P.MultiChoice 1.16',
        params: {
          question: 'Q',
          answers: [{ text: 'A', correct: true, tipsAndFeedback: { chosenFeedback: 'F' } }],
          behaviour: { enableRetry: true, type: 'auto' }
        }
      }]
    };
    const result = validateH5PQuestionSet(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question 1: Must have at least 2 answer options.');
  });

  it('rejects Blanks with no blank markers', () => {
    const content = {
      questions: [{
        library: 'H5P.Blanks 1.14',
        params: {
          text: 'Fill',
          questions: ['No blanks here'],
          behaviour: { caseSensitive: false }
        }
      }]
    };
    const result = validateH5PQuestionSet(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question 1: Sentence 1 must contain at least one blank marker (e.g., *word*).');
  });

  it('rejects DragText with no draggable markers', () => {
    const content = {
      questions: [{
        library: 'H5P.DragText 1.10',
        params: {
          taskDescription: 'Drag',
          textField: 'No markers here',
          behaviour: { enableRetry: true }
        }
      }]
    };
    const result = validateH5PQuestionSet(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question 1: Text field must contain at least one draggable marker (e.g., *word*).');
  });

  it('rejects empty questions array', () => {
    const content = { questions: [] };
    const result = validateH5PQuestionSet(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question set must contain at least one question.');
  });

  it('rejects unknown library type', () => {
    const content = {
      questions: [{
        library: 'H5P.Unknown 1.0',
        params: {}
      }]
    };
    const result = validateH5PQuestionSet(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Question 1: Unknown or unsupported library type: H5P.Unknown 1.0');
  });
});
