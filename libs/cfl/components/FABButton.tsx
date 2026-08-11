import React from 'react';
import { IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FABButtonProps {
  trainerId: string;
  trainerName?: string;
  targetRole?: 'trainer' | 'cfl_incharge';
  avatarUrl?: string;
}

const FABButton: React.FC<FABButtonProps> = ({ trainerId, trainerName, targetRole, avatarUrl }) => {
  const router = useRouter();

  return (
    <IconButton
      aria-label="add"
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 20,
        padding: 0,
        '&:hover': { opacity: 0.9 },
        zIndex: 1000
      }}
      onClick={() => {
        const roleQuery = targetRole ? `&targetRole=${targetRole}` : '';
        const avatarQuery = avatarUrl ? `&avatarUrl=${encodeURIComponent(avatarUrl)}` : '';
        const url = trainerName 
          ? `/cfl/alert?trainerId=${trainerId}&name=${encodeURIComponent(trainerName)}${roleQuery}${avatarQuery}` 
          : `/cfl/alert?trainerId=${trainerId}${roleQuery}${avatarQuery}`;
        router.push(url);
      }}
    >
      <Image 
        src="/assets/images/Notification_fab.png" 
        alt="Create Notification" 
        width={44} 
        height={44} 
      />
    </IconButton>
  );
};

export default FABButton;
