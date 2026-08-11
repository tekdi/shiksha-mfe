import { Box, Typography, Avatar } from '@mui/material';
import { useTranslation } from '@shared-lib';

interface ProfileCardProps {
  username: string;
  location: string;
  avatarUrl?: string;
  hideGreeting?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ username, location, avatarUrl, hideGreeting }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ 
      bgcolor: '#1C2B4A', 
      borderRadius: '16px', 
      p: 2.5, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 2,
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <Box>
        <Typography sx={{ fontSize: '15px', fontWeight: 700,fontFamily:'Open Sans', mb: 0.5 }}>
          {hideGreeting ? username : `${t("CFL_DASHBOARD.NAMASTE")}, ${username}`}
        </Typography>
        <Typography sx={{ fontSize: '11px',fontFamily:'Inter',fontWeight:400, opacity: 0.8 }}>
          {location.startsWith('CFL') || location.startsWith('District Incharge') || location.startsWith('ARM') ? location : `CFL: ${location}`}
        </Typography>
      </Box>
      <Avatar 
        src={avatarUrl || '/images/default.png'} 
        sx={{ 
          width: 48, 
          height: 48, 
          border: '2px solid rgba(255,255,255,0.2)',
          bgcolor: 'transparent' 
        }} 
      />
    </Box>
  );
};

export default ProfileCard;
