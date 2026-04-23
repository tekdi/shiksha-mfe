"use client";

import React, { useState } from "react";
import { Box, Select, MenuItem } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import Image from "next/image";
import appLogo from "../../../public/logo.png";
import { useTranslation } from "@shared-lib";

const Header = () => {
  const { t, setLanguage } = useTranslation();
  const [lang, setLang] = useState(
    typeof window !== "undefined" ? localStorage.getItem("lang") || "en" : "en"
  ); // state for selected language

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    setLang(newLang);
    setLanguage(newLang);
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      px={2}
      py={2}
      borderBottom="1px solid #ccc"
      bgcolor="#fff"
    >
      {/* Logo */}
      <Box display="flex" alignItems="center" gap={2}>
        <Image src={appLogo} alt="Shiksha" width={60} height={60} style={{ objectFit: "contain" }} />
      </Box>

      {/* Language Selector */}
      <Box display="flex" alignItems="center" gap={1}>
        <LanguageIcon fontSize="small" />
        <Select
          value={lang}
          onChange={handleLanguageChange}
          variant="standard"
          disableUnderline
          sx={{
            fontFamily: "Poppins",
            fontWeight: 400,
            fontSize: "14px",
            minWidth: "80px",
          }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="hi">Hindi</MenuItem>
          {/* Add more languages as needed */}
        </Select>
      </Box>
    </Box>
  );
};

export default Header;
