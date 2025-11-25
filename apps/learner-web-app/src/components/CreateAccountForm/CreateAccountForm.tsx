import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  Link,
} from '@mui/material';
import { useState, useEffect } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import Image from 'next/image';
import face from '../../../public/images/Group 3.png';
import tip from '../../../public/images/Group.png';
import { useSearchParams } from 'next/navigation';
import { showToastMessage } from '../ToastComponent/Toastify';
import { userCheck } from '@learner/utils/API/userService';
import { useTenant } from '@learner/context/TenantContext';

type Props = {
  username: string;
  onUsernameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitDisabled?: boolean;
  isGuardianConfirmed?: any;
  setIsGuardianConfirmed?: any;
  belowEighteen?: boolean;
  tenantName?: string;
};

const CreateAccountForm = ({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onSubmit,
  isSubmitDisabled = false,
  belowEighteen,
  tenantName,
}: Props) => {
  const { contentFilter } = useTenant();
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#000000";
  const primaryColor = contentFilter?.theme?.primaryColor || "#FFCB05";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const searchParams = useSearchParams();
  const newAccount = searchParams.get('newAccount');
  //const belowEighteen = newAccount === 'below-18';
  const [isGuardianConfirmed, setIsGuardianConfirmed] = useState(false);
  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleConfirmPassword = () => setShowConfirm((prev) => !prev);

  const handleUsernameChange = (value: string) => {
    onUsernameChange(value);
    setUsernameError('');
  };

  const handleUsernameBlur = async (value: string) => {
    if (value) {
      try {
        const response = await userCheck({ username: value });
        const users = response?.result || [];
        if (users.length > 0) {
          setUsernameError('Username already exists');
        } else {
          setUsernameError('');
        }
      } catch (error) {
        console.error('Error checking username:', error);
      }
    } else {
      setUsernameError('');
    }
  };

  const validatePassword = (value: string) => {
    return (
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(value) &&
      value.length >= 8
    );
  };
  const handleConsentform = () => {
    if (belowEighteen) {
      window.open('/files/consent_form_below_18_hindi.pdf', '_blank');
    } else {
      window.open('/files/consent_form_above_18_hindi.pdf', '_blank');
    }
  };
  const handlePrivacyGuidelines = () => {
    window.open('https://www.pratham.org/privacy-guidelines/', '_blank');
  };

  const isPasswordValid = validatePassword(password);
  const doPasswordsMatch = password === confirmPassword;

  const handleSubmit = () => {
    if (!doPasswordsMatch) {
      showToastMessage('Passwords do not match', 'error');
      return;
    }

    if (!isPasswordValid) {
      showToastMessage('Password does not meet requirements', 'error');
      return;
    }

    onSubmit();
  };

  return (
    <>
      <Box
        sx={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          // justifyContent: 'center',
          fontFamily: `'Inter', sans-serif`, // assuming Inter or similar
          // mt: '15px',
        }}
      >
        <Typography variant="h1" fontWeight="bold" gutterBottom>
          Sign Up for {tenantName}
        </Typography>

        <Typography
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.5px',
            textAlign: 'center',
            p: '5px',
          }}
        >
          Get vocational training to land
          <Box component="br" sx={{ display: { xs: 'block', sm: 'none' } }} />
          an entry level job with 2 months of
          <Box component="br" sx={{ display: { xs: 'block', sm: 'none' } }} />
          training
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        >
          Already signed up?{' '}
          <Link
            href="/login"
            underline="hover"
            color="secondary"
            sx={{ fontWeight: '500' }}
          >
            Click here to login
          </Link>
        </Typography>
      </Box>
      <Box
        mx="auto"
        p={3}
        sx={{
          backgroundColor: 'white',
          maxWidth: {
            xs: 350,
            md: 800,
          },
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Image src={face} alt="Step Icon" />
          <Typography fontWeight={600}>
            2/2 Create your username & password
          </Typography>
        </Box>

        {/* Alert */}
        <Alert
          icon={<Image src={tip} alt="Tip Icon" />}
          severity="info"
          sx={{
            backgroundColor: '#F7EBD9',
            color: '#000',
            fontSize: '14px',
            mb: 3,
          }}
        >
          Tip: Note down your credentials somewhere safe so you have it handy!
        </Alert>

        {/* Username */}
        <TextField
          label="Username"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          onBlur={(e) => handleUsernameBlur(e.target.value)}
          fullWidth
          margin="normal"
          error={!!usernameError}
          helperText={
            usernameError ||
            'Make it unique! Customise it with your birth date or lucky number'
          }
        />

        {/* Password */}
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePassword} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Validation checklist */}
        {password && !isPasswordValid && (
          <Box pl={1} pt={1}>
            <ValidationItem
              valid={/[A-Z]/.test(password) && /[a-z]/.test(password)}
              label="Include both uppercase and lowercase letters"
            />
            <ValidationItem
              valid={/\d/.test(password)}
              label="Include at least one number"
            />
            <ValidationItem
              valid={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
              label="Include at least one special character"
            />
            <ValidationItem
              valid={password.length >= 8}
              label="At least 8 characters"
            />
          </Box>
        )}

        {/* Confirm Password */}
        <TextField
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={toggleConfirmPassword} edge="end">
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Consent */}
        <FormControlLabel
          control={
            <Checkbox
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
          }
          label={
            <Typography variant="h3">
              I have read and agree to the
              <Typography
                component="span"
                fontWeight="bold"
                color="#0071E3"
                onClick={handlePrivacyGuidelines}
              >
                Privacy Guidelines
              </Typography>{' '}
              and I consent to the collection and use of my personal data as
              described in the{' '}
              <Typography
                component="span"
                fontWeight="bold"
                color="#0071E3"
                onClick={handleConsentform}
              >
                Consent Form
              </Typography>
              .
            </Typography>
          }
          sx={{ mt: 2, alignItems: 'flex-start' }}
        />
        {belowEighteen && (
          <FormControlLabel
            control={
              <Checkbox
                checked={isGuardianConfirmed}
                onChange={(e) => setIsGuardianConfirmed(e.target.checked)}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              />
            }
            label={
              <Typography variant="h3">
                I confirm this checkbox is filled out by the parent/guardian of
                the learner.
              </Typography>
            }
          />
        )}

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !agree ||
            isSubmitDisabled ||
            !isPasswordValid ||
            (belowEighteen && !isGuardianConfirmed) ||
            username === '' ||
            password === '' ||
            confirmPassword === '' ||
            usernameError !== ''
          }
          sx={{
            backgroundColor: primaryColor,
            color: buttonTextColor,
            fontWeight: '600',
            mt: 3,
            textTransform: 'none',
            borderRadius: 999,
            '&:hover': {
              backgroundColor: primaryColor,
              opacity: 0.9,
            },
          }}
        >
          Create Account
        </Button>
      </Box>
    </>
  );
};

const ValidationItem = ({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      color={valid ? 'green' : 'error.main'}
      fontSize="14px"
      fontWeight={400}
      mb={0.5}
    >
      <CheckIcon sx={{ fontSize: 16 }} />
      {label}
    </Box>
  );
};

export default CreateAccountForm;
