import React from 'react';
import { Breadcrumbs, Typography, Box } from '@mui/material';
import Link from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useTranslation } from 'next-i18next';
import { NEUTRAL } from '@/styles/customTheme';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsNavProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbsNav: React.FC<BreadcrumbsNavProps> = ({ items }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
        aria-label={t('LAYOUT.BREADCRUMB')}
      >
        <Link href="/users" style={{ display: 'inline-flex', alignItems: 'center', color: NEUTRAL.muted }}>
          <HomeOutlinedIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>
            {t('COMMON.HOME')}
          </Typography>
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return isLast || !item.href ? (
            <Typography key={item.label} variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {item.label}
            </Typography>
          ) : (
            <Link key={item.label} href={item.href} style={{ color: NEUTRAL.muted }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}>
                {item.label}
              </Typography>
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbsNav;
