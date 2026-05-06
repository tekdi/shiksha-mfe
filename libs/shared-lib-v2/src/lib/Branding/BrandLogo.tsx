"use client";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, SxProps, Theme } from "@mui/material/styles";
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
  /** MUI sx overrides for the wrapper Box. */
  sx?: SxProps<Theme>;
  /** MUI sx overrides for the brand-name Typography. */
  nameSx?: SxProps<Theme>;
  /** Optional click handler for the wrapper. */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const toSxArray = <T,>(value?: SxProps<T>): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : value ? [value] : [];

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
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: href || onClick ? "pointer" : "default",
        },
        ...toSxArray(sx),
      ] as SxProps<Theme>}
    >
      {href ? (
        <a
          href={href}
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
          sx={[
            {
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontFamily: branding.fontFamily,
            },
            ...toSxArray(nameSx),
          ] as SxProps<Theme>}
        >
          {resolvedName}
        </Typography>
      )}
    </Box>
  );
};

export default BrandLogo;