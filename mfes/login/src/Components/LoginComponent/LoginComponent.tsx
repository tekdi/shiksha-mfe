"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "@shared-lib"; // Updated import
import { sendOTP, verifyOTP } from "@learner/utils/API/OtPService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";

interface LoginComponentProps {
  onLogin: (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => void;
  onVerifyOtp?: (data: {
    username: string;
    otp: string;
    remember: boolean;
  }) => void;
  onVerifyMagicLink?: (data: {
    username: string;
    magicCode: string;
    remember: boolean;
  }) => void;
  handleAddAccount?: () => void;
  handleForgotPassword?: () => void;
  prefilledUsername?: string;
  magicCode?: string;
  onRedirectToLogin?: () => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({
  onLogin,
  onVerifyOtp,
  onVerifyMagicLink,
  handleAddAccount,
  handleForgotPassword,
  prefilledUsername,
  magicCode,
  onRedirectToLogin,
}) => {
  const { t } = useTranslation(); // Initialize translation function

  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forcePasswordMode, setForcePasswordMode] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);
  const [otpHash, setOtpHash] = useState<string>("");
  const hasInitializedRef = useRef(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
    magicCode: "",
    remember: false,
  });

  // Check if username is a mobile number (10+ digits)
  const isMobileNumber = (username: string) => {
    return /^\d{10,}$/.test(username);
  };

  // Process mobile number to handle country code
  const processMobileNumber = (mobile: string): string => {
    // Check if it's a 12-digit number starting with 91 (India country code)
    if (mobile.length === 12 && mobile.startsWith("91")) {
      return mobile.substring(2); // Remove the first 2 digits (91)
    }
    return mobile;
  };

  // MAGIC LINK MODE - COMMENTED OUT FOR LATER USE
  // const isMagicLinkMode = prefilledUsername && magicCode && !forcePasswordMode;
  
  // Determine if we should show OTP mode
  const isOtpMode =
    prefilledUsername &&
    isMobileNumber(prefilledUsername) &&
    !forcePasswordMode;

  // Function to check user existence and send OTP
  const sendOtp = useCallback(async (mobile: string) => {
    const now = Date.now();
    
    // Prevent duplicate calls with debounce (1000ms) and initialization check
    if (isSendingOtp || hasCheckedUser || (now - lastCallTime < 1000)) {
      console.log("sendOtp already in progress, user already checked, or called too recently");
      return;
    }
    
    console.log("Starting sendOtp for mobile:", mobile);
    setLastCallTime(now);
    setIsSendingOtp(true);
    setHasCheckedUser(true);
    try {
      // Process the mobile number to handle country code
      const processedMobile = processMobileNumber(mobile);
      console.log(
        "Original mobile:",
        mobile,
        "Processed mobile:",
        processedMobile
      );

      // First check if user exists with the specific tenant ID
      const userCheckResponse = await checkUserExistenceWithTenant(
        processedMobile
      );
      console.log("User check response:", userCheckResponse);

      // Check if API returned an error (like 404 - User does not exist, or 401 - Unauthorized)
      if (
        userCheckResponse?.params?.status === "failed" ||
        userCheckResponse?.responseCode === 404 ||
        userCheckResponse?.responseCode === 401 ||
        userCheckResponse?.responseCode !== 200
      ) {
        console.log("User does not exist or unauthorized (401/404)");
        // Show error message and call the redirect handler
        if (onRedirectToLogin) {
          setTimeout(() => {
            onRedirectToLogin();
          }, 100);
        }
        return;
      }

      // Check if user exists and has the specific tenant ID
      const users = userCheckResponse?.result?.getUserDetails || [];
      const targetTenantId = process.env.NEXT_PUBLIC_TARGET_TENANT_ID;

      if (!users || users.length === 0) {
        console.log("No users found for this mobile number");
        // Show error message for no users found
        if (onRedirectToLogin) {
          setTimeout(() => {
            onRedirectToLogin();
          }, 100);
        }
        return;
      }

      // Find user with target tenant or any user if no specific tenant required
      const userWithTargetTenant = users.find(
        (user: { tenantId: string }) => user.tenantId === targetTenantId
      ) || users[0]; // Fallback to first user if no specific tenant match

      if (userWithTargetTenant) {
        console.log("User found, sending OTP:", userWithTargetTenant);
        // User exists, send OTP for login
        const response = await sendOTP({
          mobile: processedMobile,
          reason: "login",
        });

        console.log("OTP sent successfully:", response);
        // Store the hash for OTP verification
        if (response?.result?.data?.hash) {
          setOtpHash(response.result.data.hash);
          console.log("OTP hash stored:", response.result.data.hash);
        }
        setOtpSent(true);
      } else {
        // User doesn't exist or doesn't have target tenant, show error
        console.log("User not found, showing error message");
        if (onRedirectToLogin) {
          setTimeout(() => {
            onRedirectToLogin();
          }, 100);
        }
      }
    } catch (error: unknown) {
      console.error("Error in OTP flow:", error);
      
      // Check if it's a user not found error (404) or unauthorized error (401)
      const errorResponse = error as { response?: { status?: number; data?: { responseCode?: number; params?: { status?: string; errmsg?: string } } } };
      if (
        errorResponse?.response?.status === 404 || 
        errorResponse?.response?.status === 401 ||
        errorResponse?.response?.data?.responseCode === 404 ||
        errorResponse?.response?.data?.responseCode === 401 ||
        errorResponse?.response?.data?.params?.status === "failed" ||
        errorResponse?.response?.data?.params?.errmsg === "User does not exist"
      ) {
        console.log("User does not exist or unauthorized (401/404) - showing error message");
        // Show error message and call the redirect handler
        if (onRedirectToLogin) {
          // Add a small delay to ensure the error message is properly displayed
          setTimeout(() => {
            onRedirectToLogin();
          }, 100);
        }
        return;
      }
      
      // For any other unexpected errors, switch to password mode
      setForcePasswordMode(true);
    } finally {
      setIsSendingOtp(false);
    }
  }, [isSendingOtp, hasCheckedUser, lastCallTime, onRedirectToLogin]);

  // Set prefilled username if provided and send OTP if it's a mobile number
  useEffect(() => {
    if (prefilledUsername && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setFormData((prev) => ({
        ...prev,
        username: prefilledUsername,
      }));

      // If it's a mobile number, automatically send OTP
      if (isMobileNumber(prefilledUsername)) {
        sendOtp(prefilledUsername);
      }
    }
  }, [prefilledUsername, sendOtp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (isOtpMode && onVerifyOtp) {
      // OTP mode - verify OTP first
      try {
        console.log("Verifying OTP:", formData.otp, "with hash:", otpHash);
        
        const verifyResponse = await verifyOTP({
          mobile: formData.username,
          reason: "login",
          otp: formData.otp,
          hash: otpHash,
        });
        
        console.log("OTP verification response:", verifyResponse);
        
        if (verifyResponse?.responseCode === 200 || verifyResponse?.params?.status === "successful") {
          // OTP verified successfully, proceed with login
          onVerifyOtp({
            username: formData.username,
            otp: formData.otp,
            remember: formData.remember,
          });
        } else {
          // OTP verification failed
          console.error("OTP verification failed:", verifyResponse);
          // You can add error handling here if needed
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
        // You can add error handling here if needed
      }
    } else if (onLogin) {
      // Password mode
      onLogin({
        username: formData.username,
        password: formData.password,
        remember: formData.remember,
      });
    }
  };

  const handleResendOtp = () => {
    if (formData.username && isMobileNumber(formData.username)) {
      setHasCheckedUser(false); // Reset the flag to allow resend
      setOtpHash(""); // Reset the hash
      setOtpSent(false); // Reset OTP sent status
      sendOtp(formData.username);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 400,
        p: 3,
        borderRadius: 2,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 400,
            fontSize: "24px",
            lineHeight: "32px",
            letterSpacing: "0px",
            textAlign: "center",
            mb: 3,
          }}
        >
          {isOtpMode
            ? t("LEARNER_APP.LOGIN.login_title") || "Verify OTP"
            : t("LEARNER_APP.LOGIN.login_title")}
        </Typography>

        <TextField
          label={t("LEARNER_APP.LOGIN.username_label")}
          name="username"
          value={formData.username}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="normal"
          disabled={Boolean(isOtpMode)} // Disable username field in OTP mode since it's prefilled
        />

        {isOtpMode ? (
          // OTP Mode
          <Box>
            <TextField
              label={t("LEARNER_APP.LOGIN.otp_label") || "Enter OTP"}
              name="otp"
              type="text"
              value={formData.otp}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder="Enter 6-digit OTP"
              inputProps={{
                maxLength: 6,
                pattern: "[0-9]*",
              }}
            />

            {/* OTP Status and Resend */}
            <Box
              mt={1}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              {isSendingOtp ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="textSecondary">
                    Sending OTP...
                  </Typography>
                </Box>
              ) : otpSent ? (
                <Typography variant="body2" color="success.main">
                  OTP sent successfully!
                </Typography>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  OTP will be sent automatically
                </Typography>
              )}

              {otpSent && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                >
                  Resend OTP
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          // Password Mode
          <TextField
            label={t("LEARNER_APP.LOGIN.password_label")}
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            margin="normal"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        <Box mt={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.remember}
                onChange={handleChange}
                name="remember"
              />
            }
            label={t("LEARNER_APP.LOGIN.remember_me")}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={Boolean(isOtpMode && !otpSent)}
          sx={{
            mt: 3,
            backgroundColor: "#FFC107",
            color: "#000",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#ffb300",
            },
          }}
        >
          {isOtpMode
            ? t("LEARNER_APP.LOGIN.verify_otp_button") || "Verify OTP"
            : t("LEARNER_APP.LOGIN.login_button")}
        </Button>
      </form>
    </Paper>
  );
};

export default LoginComponent;
