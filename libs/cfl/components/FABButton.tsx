import React from 'react';
import { Fab } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { useRouter } from 'next/navigation';

interface FABButtonProps {
  trainerId: string;
}

const FABButton: React.FC<FABButtonProps> = ({ trainerId }) => {
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
      onClick={() => router.push(`/cfl/alert?trainerId=${trainerId}`)}
    >
      <MessageIcon />
    </Fab>
  );
};

export default FABButton;
