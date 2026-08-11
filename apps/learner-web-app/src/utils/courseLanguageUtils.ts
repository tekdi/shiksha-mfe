export interface LanguageDisplayInfo {
  code: string;
  label: string;
  nativeLabel: string;
  emoji: string;
  description: string;
}

const KNOWN_LANGUAGES: Record<string, Omit<LanguageDisplayInfo, 'code'>> = {
  English: {
    label: 'English',
    nativeLabel: 'English',
    emoji: '🇬🇧',
    description: 'Learn in English',
  },
  Hindi: {
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    emoji: '🇮🇳',
    description: 'हिंदी में सीखें',
  },
  Marathi: {
    label: 'Marathi',
    nativeLabel: 'मराठी',
    emoji: '🏛️',
    description: 'मराठीत शिका',
  },
  Kannada: {
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    emoji: '🌿',
    description: 'ಕನ್ನಡದಲ್ಲಿ ಕಲಿಯಿರಿ',
  },
  Gujarati: {
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    emoji: '🌅',
    description: 'ગુજરાતીમાં શીખો',
  },
  Tamil: {
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    emoji: '🌺',
    description: 'தமிழில் கற்றுக்கொள்ளுங்கள்',
  },
  Telugu: {
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    emoji: '🌻',
    description: 'తెలుగులో నేర్చుకోండి',
  },
  Bengali: {
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    emoji: '🌊',
    description: 'বাংলায় শিখুন',
  },
  Odia: {
    label: 'Odia',
    nativeLabel: 'ଓଡ଼ିଆ',
    emoji: '🪷',
    description: 'ଓଡ଼ିଆରେ ଶିଖନ୍ତୁ',
  },
  Assamese: {
    label: 'Assamese',
    nativeLabel: 'অসমীয়া',
    emoji: '🍃',
    description: 'অসমীয়াত শিকক',
  },
  Punjabi: {
    label: 'Punjabi',
    nativeLabel: 'ਪੰਜਾਬੀ',
    emoji: '🌾',
    description: 'ਪੰਜਾਬੀ ਵਿੱਚ ਸਿੱਖੋ',
  },
};

const ISO_CODE_MAP: Record<string, string> = {
  en: 'English',
  eng: 'English',
  hi: 'Hindi',
  hin: 'Hindi',
  mr: 'Marathi',
  mar: 'Marathi',
  kn: 'Kannada',
  kan: 'Kannada',
  gu: 'Gujarati',
  guj: 'Gujarati',
  ta: 'Tamil',
  tam: 'Tamil',
  te: 'Telugu',
  tel: 'Telugu',
  bn: 'Bengali',
  ben: 'Bengali',
  or: 'Odia',
  ori: 'Odia',
  as: 'Assamese',
  asm: 'Assamese',
  pa: 'Punjabi',
  pan: 'Punjabi',
};

/**
 * Normalizes any language string into standard title case or mapped language name.
 */
export function normalizeLanguageName(rawLang: string): string {
  if (!rawLang || typeof rawLang !== 'string') return '';
  const trimmed = rawLang.trim();
  const lower = trimmed.toLowerCase();

  if (ISO_CODE_MAP[lower]) {
    return ISO_CODE_MAP[lower];
  }

  for (const known of Object.keys(KNOWN_LANGUAGES)) {
    if (known.toLowerCase() === lower) {
      return known;
    }
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Helper to get complete presentation information for a language.
 */
export function getLanguageDisplayInfo(languageName: string): LanguageDisplayInfo {
  const norm = normalizeLanguageName(languageName);
  const known = KNOWN_LANGUAGES[norm];

  if (known) {
    return {
      code: norm,
      ...known,
    };
  }

  return {
    code: norm || languageName,
    label: norm || languageName,
    nativeLabel: norm || languageName,
    emoji: '🌐',
    description: `Learn in ${norm || languageName}`,
  };
}

/**
 * Extracts unique available languages from a Search API course response object.
 * Checks course.contentLanguage primary field, as well as medium/language/languageCode fallbacks.
 */
export function extractCourseLanguages(course: any): string[] {
  if (!course) return ['English'];

  const extracted: string[] = [];

  const addValue = (val: any) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((v) => addValue(v));
    } else if (typeof val === 'string') {
      const parts = val.split(',');
      parts.forEach((p) => {
        const norm = normalizeLanguageName(p);
        if (norm && !extracted.includes(norm)) {
          extracted.push(norm);
        }
      });
    }
  };

  // Primary: contentLanguage field from Search API
  if (course.contentLanguage) {
    addValue(course.contentLanguage);
  }

  // Secondary fallbacks if contentLanguage is not present
  if (extracted.length === 0 && course.medium) {
    addValue(course.medium);
  }

  if (extracted.length === 0 && course.language) {
    addValue(course.language);
  }

  if (extracted.length === 0 && course.languageCode) {
    addValue(course.languageCode);
  }

  if (extracted.length === 0) {
    return ['English'];
  }

  return extracted;
}

/**
 * Filters a list of courses based on selected language.
 * Special Rule for English:
 * - If selectedLanguage is 'English', include:
 *   1) Courses where contentLanguage explicitly includes 'English' (or 'en')
 *   2) Courses that have NO contentLanguage field set (or empty/undefined)
 * - For non-English languages (e.g. 'Hindi', 'Marathi'):
 *   1) Include courses where contentLanguage explicitly includes that selected language.
 */
export function filterCoursesByLanguage(courses: any[], selectedLanguage?: string): any[] {
  if (!courses || !Array.isArray(courses)) return [];
  if (!selectedLanguage) return courses;

  const normSelected = normalizeLanguageName(selectedLanguage);

  if (normSelected === 'English') {
    return courses.filter((course) => {
      // If contentLanguage is specified on the course
      if (course.contentLanguage) {
        const langs = Array.isArray(course.contentLanguage)
          ? course.contentLanguage.map((l: string) => normalizeLanguageName(l))
          : [normalizeLanguageName(course.contentLanguage)];

        // If English is explicitly included, keep it
        if (langs.includes('English')) return true;

        // If other non-English languages are explicitly specified, exclude it
        if (langs.length > 0 && !langs.includes('English')) return false;
      }

      // If contentLanguage is not present, check languageCode if present
      if (course.languageCode) {
        const codes = Array.isArray(course.languageCode) ? course.languageCode : [course.languageCode];
        const hasNonEnglishCode = codes.some((code: string) => {
          const normCode = normalizeLanguageName(code);
          return normCode !== 'English';
        });
        if (hasNonEnglishCode) return false;
      }

      // Default: retain courses with no contentLanguage (legacy courses)
      return true;
    });
  }

  // Non-English selected language (e.g. Hindi, Marathi)
  return courses.filter((course) => {
    if (!course.contentLanguage) return false;
    const langs = Array.isArray(course.contentLanguage)
      ? course.contentLanguage.map((l: string) => normalizeLanguageName(l))
      : [normalizeLanguageName(course.contentLanguage)];

    return langs.includes(normSelected);
  });
}
