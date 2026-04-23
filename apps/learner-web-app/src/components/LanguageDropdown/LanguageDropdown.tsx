"use client";

import React, { useMemo } from "react";
import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { useTranslation } from "@shared-lib";
import { LANGUAGE_OPTIONS, LANGUAGE_LABELS, LanguageCode } from "@learner/utils/constants/language";
import { alpha } from "@mui/material/styles";
import { useTenant } from "@learner/context/TenantContext";

interface LanguageDropdownProps {
  primaryColor?: string;
  secondaryColor?: string;
  size?: "small" | "medium";
  minWidth?: number | string;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  primaryColor = "#E6873C",
  secondaryColor = "#1A1A1A",
  size = "small",
  minWidth = 150,
}) => {
  const { language, setLanguage } = useTranslation();
  const { contentFilter } = useTenant();

  // Filter available languages based on tenant configuration
  const availableLanguages = useMemo(() => {
    // If tenant has configured languages, filter by those
    if (contentFilter?.languages && contentFilter.languages.length > 0) {
      const tenantLanguageCodes = contentFilter.languages.map((lang) => lang.toLowerCase());
      return LANGUAGE_OPTIONS.filter((option) =>
        tenantLanguageCodes.includes(option.value.toLowerCase())
      );
    }
    // Otherwise, return all available languages
    return LANGUAGE_OPTIONS;
  }, [contentFilter?.languages]);

  // Ensure current language is valid, if not fallback to first available language
  const currentLanguage = useMemo(() => {
    const isValid = availableLanguages.some(
      (option) => option.value.toLowerCase() === (language || "en").toLowerCase()
    );
    if (!isValid && availableLanguages.length > 0) {
      return availableLanguages[0].value;
    }
    return language || "en";
  }, [language, availableLanguages]);

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value as LanguageCode;
    setLanguage(newLanguage);
    // Save to localStorage for persistence across the app
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLanguage);
    }
  };

  return (
    <FormControl
      size={size}
      sx={{
        minWidth: minWidth,
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        "& .MuiOutlinedInput-root": {
          "&:hover fieldset": {
            borderColor: primaryColor,
          },
          "&.Mui-focused fieldset": {
            borderColor: primaryColor,
          },
        },
      }}
    >
      <Select
        value={currentLanguage}
        onChange={handleLanguageChange}
        sx={{
          color: secondaryColor,
          "& .MuiSelect-select": {
            color: secondaryColor,
            fontWeight: 500,
            fontSize: 14,
            py: size === "small" ? 0.75 : 1,
          },
          "& .MuiSvgIcon-root": {
            color: secondaryColor,
          },
        }}
      >
        {availableLanguages.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              color: secondaryColor,
              "&:hover": {
                backgroundColor: alpha(primaryColor, 0.08),
              },
              "&.Mui-selected": {
                backgroundColor: alpha(primaryColor, 0.12),
                "&:hover": {
                  backgroundColor: alpha(primaryColor, 0.16),
                },
              },
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageDropdown;

