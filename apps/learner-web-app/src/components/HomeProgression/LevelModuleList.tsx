'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import ModuleRow, { ModuleData } from './ModuleRow';
import { useRouter } from 'next/navigation';

interface LevelModuleListProps {
  levelName: string;
  levelId: string;
  modules: ModuleData[];
}

const LevelModuleList: React.FC<LevelModuleListProps> = ({ levelName, levelId, modules }) => {
  const router = useRouter();
  const completedCount = modules.filter((m) => m.completionPercentage >= 100).length;
  const hasStarted = modules.some((m) => m.completionPercentage > 0);
  const heading = hasStarted ? 'Continue Learning' : 'Start Learning';

  return (
    <Box sx={{ mb: 2 }}>
      {/* Section heading */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography
          sx={{ fontWeight: 700, fontSize: 16, color: '#1F2937', fontFamily: 'Inter, sans-serif' }}
        >
          {heading}
        </Typography>
        <Box
          onClick={() => router.push('/learn')}
          sx={{ cursor: 'pointer' }}
        >
          <Typography sx={{ fontSize: 12, color: '#E6873C', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            {levelName} Completed {completedCount}/{modules.length}
          </Typography>
        </Box>
      </Box>

      {/* Module rows */}
      {modules.map((module) => (
        <ModuleRow
          key={module.id}
          module={module}
          levelId={levelId}
          onClick={() => router.push(`/learn/${levelId}/${module.id}`)}
        />
      ))}
    </Box>
  );
};

export default LevelModuleList;
