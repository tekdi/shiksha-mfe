import { useTranslation } from "next-i18next";

// RTL languages list
const RTL_LANGUAGES = [
  "ar",
  "he",
  "ur",
  "fa",
  "yi",
  "ji",
  "iw",
  "ku",
  "ps",
  "sd",
];

export const useDirection = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n?.language || "en";

  // Determine direction based on language code
  // Extract base language code (e.g., 'ar' from 'ar-SA')
  const baseLanguage = currentLanguage.split("-")[0].toLowerCase();
  const isRTL = RTL_LANGUAGES.includes(baseLanguage);
  const dir = isRTL ? "rtl" : "ltr";

  return { dir, isRTL };
};
