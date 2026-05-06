"use client";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  TenantBranding,
  useTenantBranding,
} from "../context/TenantBrandingContext";

export interface BrandLogoProps {
  /** Override the logo URL from context. */
  logo?: string;
  /** Override the brand name from context. */
  name?: string;
  /** Override the alt text. Defaults to `${name} logo`. */
  alt?: string;
  /** Hide the brand name text and render only the logo. */
  hideName?: boolean;
  /** Pixel height of the logo image. */
  logoHeight?: number;
  /** Optional href — when set, the logo becomes a link. */
  href?: string;
  /** Inline styles on the wrapper Box. */
  sx?: React.CSSProperties;
  /** Inline styles on the brand-name Typography. */
  nameSx?: React.CSSProperties;
  /** Optional click handler for the wrapper. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const buildAlt = (branding: Pick<TenantBranding, "name" | "logoAlt">) =>
  branding.logoAlt ?? `${branding.name} logo`;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logo,
  name,
  alt,
  hideName = false,
  logoHeight = 40,
  href,
  sx,
  nameSx,
  onClick,
}) => {
  const branding = useTenantBranding();
  const theme = useTheme();

  const resolvedName = name || branding.name;
  const resolvedLogo = logo ?? branding.logo;
  const resolvedAlt = alt ?? buildAlt({ name: resolvedName, logoAlt: branding.logoAlt });

  const image = (
    <img
      src={resolvedLogo}
      alt={resolvedAlt}
      style={{ height: `${logoHeight}px`, display: "block" }}
    />
  );

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: href || onClick ? "pointer" : "default",
        ...sx,
      }}
    >
      {href ? (
        <a
          href={href}
          aria-label={resolvedAlt}
          style={{ display: "inline-flex", textDecoration: "none" }}
        >
          {image}
        </a>
      ) : (
        image
      )}
      {!hideName && resolvedName && (
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontFamily: branding.fontFamily,
            ...nameSx,
          }}
        >
          {resolvedName}
        </Typography>
      )}
    </Box>
  );
};

export default BrandLogo;