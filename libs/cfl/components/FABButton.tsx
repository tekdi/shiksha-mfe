import React from 'react';
import { Fab } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { useRouter } from 'next/navigation';

interface FABButtonProps {
  trainerId: string;
  trainerName?: string;
}

const FABButton: React.FC<FABButtonProps> = ({ trainerId, trainerName }) => {
  const router = useRouter();

  return (
    <Fab
      color="primary"
      aria-label="add"
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        bgcolor: '#1C2B4A', // Dark Navy like in Figma
        '&:hover': { bgcolor: '#121d33' }
      }}
      onClick={() => {
        const url = trainerName ? `/cfl/alert?trainerId=${trainerId}&name=${encodeURIComponent(trainerName)}` : `/cfl/alert?trainerId=${trainerId}`;
        router.push(url);
      }}
    >
      <MessageIcon />
    </Fab>
  );
};

export default FABButton;
