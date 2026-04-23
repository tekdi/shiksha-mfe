/**
 * Language constants for the learner app
 */

export const LANGUAGES = {
  ENGLISH: "en",
  HINDI: "hi",
  MARATHI: "mr",
} as const;

export const LANGUAGE_LABELS = {
  [LANGUAGES.ENGLISH]: "English",
  [LANGUAGES.HINDI]: "हिन्दी",
  [LANGUAGES.MARATHI]: "मराठी",
} as const;

export const LANGUAGE_OPTIONS = [
  { value: LANGUAGES.ENGLISH, label: LANGUAGE_LABELS[LANGUAGES.ENGLISH] },
  { value: LANGUAGES.HINDI, label: LANGUAGE_LABELS[LANGUAGES.HINDI] },
  { value: LANGUAGES.MARATHI, label: LANGUAGE_LABELS[LANGUAGES.MARATHI] },
] as const;

export type LanguageCode = typeof LANGUAGES[keyof typeof LANGUAGES];

