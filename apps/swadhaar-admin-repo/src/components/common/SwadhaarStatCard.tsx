import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';

export interface SwadhaarStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  bg?: string;
  loading?: boolean;
  onClick?: () => void;
}

const TREND_COLORS: Record<NonNullable<SwadhaarStatCardProps['trend']>, string> = {
  up: 'success.main',
  down: 'error.main',
  neutral: 'text.secondary',
};

export const SwadhaarStatCard: React.FC<SwadhaarStatCardProps> = ({
  label,
  value,
  change,
  trend,
  icon,
  bg = 'rgba(230, 135, 60, 0.08)',
  loading = false,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }
          : undefined,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, pr: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width="60%" height={40} />
            ) : (
              <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700, mb: 0.5 }}>
                {value}
              </Typography>
            )}
            {change && (
              <Typography
                variant="body2"
                sx={{
                  color: TREND_COLORS[trend ?? 'neutral'],
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                {change}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SwadhaarStatCard;
