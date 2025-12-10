/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, {
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getUserId, login } from "@learner/utils/API/LoginService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";
import { sendOTP, verifyOTP } from "@learner/utils/API/OtPService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { useRouter } from "next/navigation";
import { useTranslation } from "@shared-lib";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";
import Image from "next/image";
import playstoreIcon from "../../../public/images/playstore.png";
import prathamQRCode from "../../../public/images/prathamQR.png";
import welcomeGIF from "../../../public/logo.png";
import { logEvent } from "@learner/utils/googleAnalytics";
import {
  ensureAcademicYearForTenant,
  getTenantInfo,
} from "@learner/utils/API/ProgramService";
import { alpha } from "@mui/material/styles";
import { useTenant } from "@learner/context/TenantContext";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";

// Helper function to get cookie value
const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Inline Login Component
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
    hash: string;
  }) => void;
  handleAddAccount?: () => void;
  handleForgotPassword?: () => void;
  prefilledUsername?: string;
  onRedirectToLogin?: () => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({
  onLogin,
  onVerifyOtp,
  handleAddAccount,
  handleForgotPassword,
  prefilledUsername,
  onRedirectToLogin,
}) => {
  const { t } = useTranslation();
  const { contentFilter, tenant } = useTenant();

  // Determine login method from tenant config
  const loginMethod = contentFilter?.loginMethod || "otp";
  const isOtpLoginMethod = loginMethod === "otp";

  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forcePasswordMode, setForcePasswordMode] = useState(!isOtpLoginMethod); // Default based on tenant config
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);
  const [otpHash, setOtpHash] = useState<string>("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const hasInitializedRef = useRef(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
    remember: false,
  });
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#FFFFFF";
  
  // OTP input refs for individual boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Determine if we should show OTP mode
  // For OTP login method, show OTP if mobile number and OTP sent
  // For password login method, always show password
  const isOtpMode = isOtpLoginMethod && 
    otpSent && 
    !forcePasswordMode;

  // Function to check user existence and send OTP
  const sendOtp = useCallback(
    async (mobile: string) => {
      const now = Date.now();

      // Prevent duplicate calls with debounce (1000ms) and initialization check
      if (isSendingOtp || hasCheckedUser || now - lastCallTime < 1000) {
        console.log(
          "sendOtp already in progress, user already checked, or called too recently"
        );
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

        // Check if API returned an error (like 404 - User does not exist)
        if (
          userCheckResponse?.params?.status === "failed" ||
          userCheckResponse?.responseCode === 404 ||
          userCheckResponse?.responseCode !== 200
        ) {
          console.log("User does not exist");
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
        
        // Get tenant ID from the tenant context (domain-based tenant)
        const domainTenantId = tenant?.tenantId;
        
        if (!domainTenantId) {
          console.error("No tenant found for this domain");
          showToastMessage(
            "Tenant configuration not found. Please contact administrator.",
            "error"
          );
          return;
        }

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

        // Find user with matching tenant ID - MUST match domain tenant
        const userWithTargetTenant = users.find(
          (user: { tenantId: string }) => user.tenantId === domainTenantId
        );

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
          // Start 120 second timer when first entering OTP step
          setResendTimer(120);
          // Trigger OTP mode by setting prefilledUsername
          setFormData((prev) => ({
            ...prev,
            username: processedMobile,
          }));
        } else {
          // User doesn't belong to this tenant, show error
          console.log("User does not belong to this tenant");
          showToastMessage(
            "This user is not registered for this tenant. Please contact your administrator.",
            "error"
          );
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          // Reset hasCheckedUser to allow user to try again with different number
          setHasCheckedUser(false);
        }
      } catch (error: unknown) {
        console.error("Error in OTP flow:", error);

        // Check if it's a user not found error (404)
        const errorResponse = error as {
          response?: {
            status?: number;
            data?: {
              responseCode?: number;
              params?: { status?: string; errmsg?: string };
            };
          };
        };
        if (
          errorResponse?.response?.status === 404 ||
          errorResponse?.response?.data?.responseCode === 404 ||
          errorResponse?.response?.data?.params?.status === "failed" ||
          errorResponse?.response?.data?.params?.errmsg ===
            "User does not exist"
        ) {
          console.log("User does not exist - showing error message");
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
    },
    [isSendingOtp, hasCheckedUser, lastCallTime, onRedirectToLogin, isOtpLoginMethod, tenant]
  );

  // Set prefilled username if provided and send OTP if it's a mobile number
  useEffect(() => {
    if (prefilledUsername && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setFormData((prev) => ({
        ...prev,
        username: prefilledUsername,
      }));

      // Only send OTP if user is not already authenticated and login method is OTP
      const existingToken =
        localStorage.getItem("token") || getCookieValue("token");
    

      if (!existingToken && isMobileNumber(prefilledUsername) && isOtpLoginMethod) {
        sendOtp(prefilledUsername);
      } else {
        console.log(
          "🚫 LoginComponent: Not sending OTP - user already authenticated, not mobile number, or password login method"
        );
      }
    }
  }, [prefilledUsername, sendOtp, isOtpLoginMethod]);

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

        if (
          verifyResponse?.responseCode === 200 ||
          verifyResponse?.params?.status === "successful"
        ) {
          // OTP verified successfully, proceed with login
          onVerifyOtp({
            username: formData.username,
            otp: formData.otp,
            remember: formData.remember,
            hash: otpHash,
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

  const handleSendOtp = async () => {
    if (formData.username && isMobileNumber(formData.username)) {
      await sendOtp(formData.username);
    }
  };

  // Timer countdown effect for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    // Filter out non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue.length > 1) {
      // If pasting, handle all digits
      const digits = numericValue.slice(0, 6).split("");
      const newOtp = [...formData.otp.split("")];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setFormData((prev) => ({
        ...prev,
        otp: newOtp.join("").slice(0, 6),
      }));
      // Focus on the last filled box or next empty box
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input - only allow if it's a number
      if (numericValue || value === "") {
        const newOtp = formData.otp.split("");
        newOtp[index] = numericValue;
        setFormData((prev) => ({
          ...prev,
          otp: newOtp.join("").slice(0, 6),
        }));
        // Move to next box if value entered
        if (numericValue && index < 5) {
          otpRefs.current[index + 1]?.focus();
        }
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    // Filter out non-numeric characters
    const numericValue = pastedData.replace(/\D/g, "");
    
    if (numericValue.length > 0) {
      // Take only first 6 digits
      const digits = numericValue.slice(0, 6).split("");
      const newOtp = new Array(6).fill("");
      
      // Fill the OTP array with pasted digits
      digits.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      
      setFormData((prev) => ({
        ...prev,
        otp: newOtp.join(""),
      }));
      
      // Focus on the last filled box or the last box if all 6 digits are pasted
      const nextIndex = Math.min(digits.length - 1, 5);
      if (nextIndex >= 0) {
        setTimeout(() => {
          otpRefs.current[nextIndex]?.focus();
        }, 0);
      }
    }
  };

  const handleResendOtp = async () => {
    // Check if resend attempts limit reached
    if (resendAttempts >= 2) {
      showToastMessage(
        "Maximum resend attempts reached. Please try again later.",
        "error"
      );
      return;
    }

    // Check if timer is still active
    if (resendTimer > 0) {
      return;
    }

    if (formData.username && isMobileNumber(formData.username)) {
      setResendTimer(120); // Start 120 second timer
      setResendAttempts((prev) => prev + 1); // Increment attempt count
      
      // Reset the flag to allow resend but keep OTP mode active
      setHasCheckedUser(false);
      
      // Call sendOtp directly without resetting otpSent
      const processedMobile = processMobileNumber(formData.username);
      setIsSendingOtp(true);
      
      try {
        const response = await sendOTP({
          mobile: processedMobile,
          reason: "login",
        });

        console.log("OTP resent successfully:", response);
        // Store the new hash for OTP verification
        if (response?.result?.data?.hash) {
          setOtpHash(response.result.data.hash);
          console.log("New OTP hash stored:", response.result.data.hash);
        }
        // Clear the OTP input so user can enter new OTP
        setFormData((prev) => ({
          ...prev,
          otp: "",
        }));
        showToastMessage("OTP resent successfully", "success");
      } catch (error) {
        console.error("Error resending OTP:", error);
        showToastMessage("Failed to resend OTP. Please try again.", "error");
        // Decrement attempt count on error so user can retry
        setResendAttempts((prev) => Math.max(0, prev - 1));
      } finally {
        setIsSendingOtp(false);
        setHasCheckedUser(true);
      }
    }
  };

  const router = useRouter();

  const handleBack = () => {
    if (isOtpMode) {
      // Go back to phone number step
      setOtpSent(false);
      setHasCheckedUser(false);
      setOtpHash("");
      setResendTimer(0);
      setResendAttempts(0); // Reset resend attempts when going back
      setFormData((prev) => ({
        ...prev,
        otp: "",
      }));
    } else {
      // Go back to home page
      router.push("/");
    }
  };
  // If password login method, show password form
  if (!isOtpLoginMethod) {
  return (
      <Box
      sx={{
          maxWidth: { xs: "100%", sm: 500 },
          width: "100%",
          mx: "auto",
          px: { xs: 1, sm: 0 },
        }}
      >
        {/* Back Button */}
        <IconButton
          onClick={() => router.push("/")}
          sx={{
            mb: { xs: 1.5, sm: 2 },
            color: secondaryColor,
            "&:hover": {
              backgroundColor: `${primaryColor}15`,
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        {/* Login Title */}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "24px", sm: "26px", md: "28px" },
            lineHeight: { xs: "32px", sm: "36px", md: "40px" },
            color: secondaryColor,
            mb: { xs: 2, sm: 2.5 },
          }}
        >
          {t("LEARNER_APP.LOGIN.login_title") || "Login"}
        </Typography>

        {/* Username Field */}
        <TextField
          label={t("LEARNER_APP.LOGIN.username_label") || "Username"}
          name="username"
          value={formData.username}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px",
              backgroundColor: backgroundColor,
              "& fieldset": {
                borderColor: secondaryColor,
              },
              "&:hover fieldset": {
                borderColor: secondaryColor,
              },
              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },
          }}
        />

        {/* Password Field */}
          <TextField
          label={t("LEARNER_APP.LOGIN.password_label") || "Password"}
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
                  sx={{ color: secondaryColor }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px",
              backgroundColor: backgroundColor,
              "& fieldset": {
                borderColor: secondaryColor,
              },
              "&:hover fieldset": {
                borderColor: primaryColor,
              },
              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },
          }}
        />


        <Button
          onClick={handleSubmit}
          fullWidth
          sx={{
            mt: 3,
            py: { xs: 1.25, sm: 1.5 },
            backgroundColor: primaryColor,
            color: `${buttonTextColor} !important`,
            fontSize: { xs: "14px", sm: "16px" },
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: primaryColor,
              opacity: 0.9,
              color: `${buttonTextColor} !important`,
            },
          }}
        >
          {t("LEARNER_APP.LOGIN.login_button") || "Login"}
        </Button>
      </Box>
    );
  }

  // OTP Login Method - Show stepper UI
  return (
    <Box
      sx={{
        maxWidth: { xs: "100%", sm: 500 },
        width: "100%",
        mx: "auto",
        px: { xs: 1, sm: 0 },
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={handleBack}
        sx={{
          mb: { xs: 1.5, sm: 2 },
          color: secondaryColor,
          "&:hover": {
            backgroundColor: `${primaryColor}15`,
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Login Title - H1: 24-28px */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "24px", sm: "26px", md: "28px" },
          lineHeight: { xs: "32px", sm: "36px", md: "40px" },
          color: secondaryColor,
          mb: { xs: 2, sm: 2.5 },
        }}
      >
        {t("LEARNER_APP.LOGIN.login_title") || "Login"}
      </Typography>

      {!isOtpMode ? (
        // Phone Number Step
        <>
          {/* Instruction Text */}
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: "14px", sm: "15px", md: "16px" },
              lineHeight: { xs: "20px", sm: "22px", md: "24px" },
              color: secondaryColor,
              mb: { xs: 3, sm: 4 },
            }}
          >
            👋 {t("LEARNER_APP.LOGIN.PHONE_INSTRUCTION") || "Hi there! Log in with your registered phone number to continue."}
          </Typography>

          {/* Phone Number Input */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: { xs: "13px", sm: "14px" },
                color: secondaryColor,
                mb: 1,
              }}
            >
              {t("LEARNER_APP.LOGIN.PHONE_NUMBER") || "Phone Number"}
            </Typography>
            <TextField
              name="username"
              value={formData.username}
              onChange={(e) => {
                // Only allow numbers and limit to 10 digits
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setFormData((prev) => ({
                  ...prev,
                  username: value,
                }));
                // Reset hasCheckedUser when user changes the phone number
                if (hasCheckedUser) {
                  setHasCheckedUser(false);
                }
              }}
              placeholder="+91 0000000000"
              fullWidth
              inputProps={{
                maxLength: 10,
                pattern: "[0-9]*",
                inputMode: "numeric",
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  backgroundColor: backgroundColor,
                  "& fieldset": {
                    borderColor: "#E0E0E0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#E0E0E0",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: primaryColor,
                  },
                },
              }}
            />
          </Box>
          {/* Send OTP Button */}
          <Button
            onClick={handleSendOtp}
            disabled={!formData.username || isSendingOtp}
            fullWidth
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              backgroundColor: primaryColor,
              color: `${buttonTextColor} !important`,
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              mb: { xs: 4, sm: 6 },
              "&:hover": {
                backgroundColor: primaryColor,
                opacity: 0.9,
                color: `${buttonTextColor} !important`,
              },
              "&:focus": {
                backgroundColor: primaryColor,
                boxShadow: `0 0 0 3px ${primaryColor}33`,
                color: `${buttonTextColor} !important`,
              },
              "&:disabled": {
                backgroundColor: backgroundColor,
                color: secondaryColor,
                opacity: 0.5,
              },
            }}
          >
            {isSendingOtp ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: buttonTextColor }} />
                <span>{t("LEARNER_APP.LOGIN.SENDING") || "Sending..."}</span>
              </Box>
            ) : (
              t("LEARNER_APP.LOGIN.SEND_OTP") || "SEND OTP"
            )}
          </Button>

          {/* Pagination Dots - Step 2 (First and second dots active) */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: primaryColor,
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: primaryColor,
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#E0E0E0",
              }}
          />
        </Box>
        </>
      ) : (
        // OTP Verification Step
        <>
          {/* Instruction Text */}
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: "14px", sm: "15px", md: "16px" },
              lineHeight: { xs: "20px", sm: "22px", md: "24px" },
              color: secondaryColor,
              mb: { xs: 3, sm: 4 },
            }}
          >
            {t("LEARNER_APP.LOGIN.OTP_INSTRUCTION") || "Enter the 6-digit OTP sent to your phone."}
          </Typography>

          {/* OTP Label */}
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: "14px",
              color: secondaryColor,
              mb: 2,
            }}
          >
            {t("LEARNER_APP.LOGIN.otp_label") || "OTP"}
          </Typography>

          {/* 6 Individual OTP Input Boxes */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, sm: 1.5 },
              mb: { xs: 3, sm: 4 },
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextField
                key={index}
                inputRef={(el) => {
                  otpRefs.current[index] = el;
                }}
                value={formData.otp[index] || ""}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                inputProps={{
                  maxLength: 1,
                  pattern: "[0-9]*",
                  inputMode: "numeric",
                  style: {
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: 600,
                  },
                }}
                onInput={(e) => {
                  // Additional validation to prevent non-numeric input
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/\D/g, "");
                }}
                sx={{
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  "& .MuiOutlinedInput-root": {
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    borderRadius: "4px",
                    "& input": {
                      fontSize: { xs: "20px", sm: "24px" },
                    },
                    "& fieldset": {
                      borderColor: "#E0E0E0",
                    },
                    "&:hover fieldset": {
                      borderColor: primaryColor,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: primaryColor,
                    },
                  },
                }}
              />
            ))}
          </Box>

          {/* Send Button */}
        <Button
            onClick={handleSubmit}
            disabled={formData.otp.length !== 6}
          fullWidth
          sx={{
              py: { xs: 1.25, sm: 1.5 },
              backgroundColor: primaryColor,
              color: `${buttonTextColor} !important`,
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              mb: { xs: 1.5, sm: 2 },
            "&:hover": {
                backgroundColor: primaryColor,
                opacity: 0.9,
                color: `${buttonTextColor} !important`,
              },
              "&:focus": {
                backgroundColor: primaryColor,
                boxShadow: `0 0 0 3px ${primaryColor}33`,
                color: `${buttonTextColor} !important`,
              },
              "&:disabled": {
                backgroundColor: backgroundColor,
                color: secondaryColor,
                opacity: 0.5,
            },
          }}
        >
            {t("LEARNER_APP.LOGIN.ENTER_OTP") || "ENTER OTP"}
        </Button>

          {/* Resend OTP Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: { xs: 4, sm: 6 },
            }}
          >
            <Button
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || resendAttempts >= 2}
              sx={{
                textTransform: "none",
                color: resendAttempts >= 2 ? "#999999" : primaryColor,
                fontSize: { xs: "13px", sm: "14px" },
                fontWeight: 400,
                minWidth: "auto",
                padding: 0,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
                "&:disabled": {
                  color: "#999999",
                },
              }}
            >
              {resendAttempts >= 2
                ? t("LEARNER_APP.LOGIN.RESEND_OTP_DISABLED") || "Resend OTP (Limit Reached)"
                : resendTimer > 0
                ? `${t("LEARNER_APP.LOGIN.RESEND_OTP") || "Resend OTP"} (${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, "0")})`
                : t("LEARNER_APP.LOGIN.RESEND_OTP") || "Resend OTP"}
            </Button>
          </Box>

          {/* Pagination Dots - Step 3 */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: primaryColor,
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: primaryColor,
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: primaryColor,
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

const AppDownloadSection = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      maxWidth="500px"
    >
      {/* QR Code Section */}
      <Grid item xs={5} sm={5} md={4}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={1}
        >
          <Image
            src={prathamQRCode}
            alt={t("LEARNER_APP.LOGIN.qr_image_alt")}
            width={120}
            height={120}
            style={{ objectFit: "contain" }}
          />
          <Box textAlign="center">
            <Typography fontWeight={600} fontSize="14px">
              {t("LEARNER_APP.LOGIN.GET_THE_APP")}
            </Typography>
            <Typography fontSize="12px" color="textSecondary">
              {t("LEARNER_APP.LOGIN.POINT_YOUR_PHONE")}
              <br />
              {t("LEARNER_APP.LOGIN.POINT_CAMERA")}
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* OR Divider */}
      <Grid
        item
        xs={2}
        sm={2}
        md={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography fontWeight={500} fontSize="14px">
          {t("LEARNER_APP.LOGIN.OR")}
        </Typography>
      </Grid>

      {/* Play Store Section */}
      <Grid item xs={5} sm={5} md={5}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={1}
          sx={{ cursor: "pointer" }}
          onClick={() => {
            router.push(
              "https://play.google.com/store/apps/details?id=com.pratham.learning"
            );
          }}
        >
          <Image
            src={playstoreIcon}
            alt={t("LEARNER_APP.LOGIN.playstore_image_alt")}
            width={100}
            height={32}
          />
          <Box textAlign="center">
            <Typography fontSize="12px" color="textSecondary">
              {t("LEARNER_APP.LOGIN.SEARCH_PLAYSTORE")}
              <br />
              {t("LEARNER_APP.LOGIN.ON_PLAYSTORE")}
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

const WelcomeMessage = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
      <Image
        src={welcomeGIF}
        alt={t("LEARNER_APP.LOGIN.welcome_image_alt")}
        width={120}
        height={120}
        style={{ marginBottom: "24px" }}
      />

      <Typography
        fontWeight={400}
        fontSize={{ xs: "24px", sm: "32px" }}
        lineHeight={{ xs: "32px", sm: "40px" }}
        letterSpacing="0px"
        textAlign="center"
        sx={{ verticalAlign: "middle" }}
      >
        {t("LEARNER_APP.LOGIN.welcome_title")}
      </Typography>
      <Typography
        fontWeight={400}
        fontSize={{ xs: "18px", sm: "22px" }}
        lineHeight={{ xs: "24px", sm: "28px" }}
        letterSpacing="0px"
        textAlign="center"
        sx={{ verticalAlign: "middle" }}
        mb={2}
      >
        {t("LEARNER_APP.LOGIN.welcome_subtitle")}
      </Typography>
    </Box>
  );
};

const LoginPage = () => {
  const router = useRouter();
  const [prefilledUsername, setPrefilledUsername] = useState<string>("");
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [entryMode, setEntryMode] = useState<"selection" | "learner">("selection");
  const { tenant, contentFilter } = useTenant();

  // Get tenant colors and logo
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#FFFFFF";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;

  const handleAddAccount = () => {
    router.push("/");
  };

  const { t } = useTranslation();

  const handleSuccessfulLogin = async (
    response: { access_token: string; refresh_token?: string },
    data: { remember: boolean },
    router: { push: (url: string) => void }
  ) => {
    if (typeof window !== "undefined" && window.localStorage) {
      const token = response.access_token;
      const refreshToken = response?.refresh_token;
      localStorage.setItem("token", token);
      data?.remember && refreshToken
        ? localStorage.setItem("refreshToken", refreshToken)
        : localStorage.removeItem("refreshToken");

      const userResponse = await getUserId();

      // If getUserId returns null (due to 401 redirect), exit early
      if (!userResponse) {
        return;
      }

      if (userResponse) {
        // Validate that user's tenant matches the domain tenant
        const userTenantId = userResponse?.tenantData?.[0]?.tenantId;
        const domainTenantId = tenant?.tenantId;
        
        if (!domainTenantId) {
          showToastMessage(
            "Tenant configuration not found. Please contact administrator.",
            "error"
          );
          // Clear token and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return;
        }
        
        if (userTenantId !== domainTenantId) {
          console.error(
            `Tenant mismatch: User tenantId (${userTenantId}) does not match domain tenantId (${domainTenantId})`
          );
          showToastMessage(
            "This user is not registered for this tenant. Please contact your administrator.",
            "error"
          );
          // Clear token and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return;
        }
        
        const userRole = userResponse?.tenantData?.[0]?.roleName;

        // Handle Learner role - redirect to learner dashboard
        if (userRole === "Learner"  || userRole === "Teacher") {
          localStorage.setItem("userId", userResponse?.userId);
          localStorage.setItem(
            "templtateId",
            userResponse?.tenantData?.[0]?.templateId
          );
          localStorage.setItem("userIdName", userResponse?.username);
          localStorage.setItem("firstName", userResponse?.firstName || "");

          const tenantId = userResponse?.tenantData?.[0]?.tenantId;
          const tenantName = userResponse?.tenantData?.[0]?.tenantName;
          const uiConfig = userResponse?.tenantData?.[0]?.params?.uiConfig;

          localStorage.setItem("uiConfig", JSON.stringify(uiConfig || {}));

          localStorage.setItem("tenantId", tenantId);
          localStorage.setItem("userProgram", tenantName);
          await profileComplitionCheck();
          if (tenantId) {
            await ensureAcademicYearForTenant(tenantId);
          }
          const telemetryInteract = {
            context: { env: "sign-in", cdata: [] },
            edata: {
              id: "login-success",
              type: "CLICK",
              pageid: "sign-in",
              uid: userResponse?.userId || "Anonymous",
            },
          };
          telemetryFactory.interact(telemetryInteract);

          const channelId = userResponse?.tenantData?.[0]?.channelId;
          localStorage.setItem("channelId", channelId);

          const collectionFramework =
            userResponse?.tenantData?.[0]?.collectionFramework;
          localStorage.setItem("collectionFramework", collectionFramework);

          document.cookie = `token=${token}; path=/; secure; SameSite=Strict`;
          const query = new URLSearchParams(window.location.search);
          const redirectUrl = query.get("redirectUrl");
          const activeLink = query.get("activeLink");
          if (redirectUrl && redirectUrl.startsWith("/")) {
            router.push(
              `${redirectUrl}${activeLink ? `?activeLink=${activeLink}` : ""}`
            );
          }
          logEvent({
            action: "successfully-login-in-learner-app",
            category: "Login Page",
            label: "Login Button Clicked",
          });

          // Check for redirect path stored by AuthGuard
          const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
          if (redirectAfterLogin && redirectAfterLogin.startsWith("/")) {
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = `${window.location.origin}${redirectAfterLogin}`;
          } else {
            // Redirect to learner dashboard with tab=1
            window.location.href = `${window.location.origin}/dashboard?tab=1`;
          }
          return;
        }

        // Handle Creator, Reviewer, Admin roles - redirect to admin portal with SSO
        else if (
          userRole === "Creator" ||
          userRole === "Reviewer" ||
          userRole === "Admin"
        ) {
          // Store user data for SSO
          localStorage.setItem("userId", userResponse?.userId);
          localStorage.setItem("userIdName", userResponse?.username);
          localStorage.setItem("firstName", userResponse?.firstName || "");
          localStorage.setItem("userRole", userRole);

          const tenantId = userResponse?.tenantData?.[0]?.tenantId;
          const tenantName = userResponse?.tenantData?.[0]?.tenantName;
          localStorage.setItem("tenantId", tenantId);
          localStorage.setItem("userProgram", tenantName);

          // Create SSO token for admin portal
          const ssoData = {
            token: token,
            userId: userResponse?.userId,
            username: userResponse?.username,
            firstName: userResponse?.firstName,
            role: userRole,
            tenantId: tenantId,
            tenantName: tenantName,
            timestamp: Date.now(),
          };

          // Store SSO data in localStorage for cross-domain access
          localStorage.setItem("ssoData", JSON.stringify(ssoData));

          // Set cookie for admin portal
          document.cookie = `sso_token=${token}; path=/; secure; SameSite=Lax`;
          document.cookie = `user_data=${JSON.stringify(
            ssoData
          )}; path=/; secure; SameSite=Lax`;

          const telemetryInteract = {
            context: { env: "sign-in", cdata: [] },
            edata: {
              id: "login-success-admin",
              type: "CLICK",
              pageid: "sign-in",
              uid: userResponse?.userId || "Anonymous",
            },
          };
          telemetryFactory.interact(telemetryInteract);

          logEvent({
            action: "successfully-login-admin-redirect",
            category: "Login Page",
            label: "Admin Login Button Clicked",
          });

          // Redirect to admin portal with SSO
          window.location.href = `${window.location.origin.replace(
            "3003",
            "3002"
          )}/login`;
          return;
        }

        // Handle unknown roles
        else {
          showToastMessage(
            "User role not recognized. Please contact administrator.",
            "error"
          );
          const telemetryInteract = {
            context: { env: "sign-in", cdata: [] },
            edata: {
              id: "login-failed-unknown-role",
              type: "CLICK",
              pageid: "sign-in",
            },
          };
          telemetryFactory.interact(telemetryInteract);
        }
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {

        preserveLocalStorage();

        // Check for existing authentication first - check both localStorage and cookies
        const localStorageToken = localStorage.getItem("token");
        const cookieToken = getCookieValue("token");
        const access_token = localStorageToken || cookieToken;
        const refresh_token = localStorage.getItem("refreshToken");


        if (access_token) {

          // Check if we have all required authentication data
          const userId = localStorage.getItem("userId");
          const tenantId = localStorage.getItem("tenantId");
          
          // If we have all required data, redirect directly
          if (userId && tenantId) {
            
            // Check for redirect URL in query parameters
            if (typeof window !== "undefined") {
              const searchParams = new URLSearchParams(window.location.search);
              const redirectUrl = searchParams.get("redirectUrl");
              const activeLink = searchParams.get("activeLink");


              if (redirectUrl && redirectUrl.startsWith("/")) {
                // Direct redirect to the target URL without going through login flow
                window.location.href = `${window.location.origin}${redirectUrl}${
                  activeLink ? `?activeLink=${activeLink}` : ""
                }`;
                return;
              }
            }

            // If no redirect URL, redirect to dashboard
            window.location.href = `${window.location.origin}/dashboard?tab=1`;
            return;
          } else {
            // If we have a token but missing userId/tenantId, proceed with full login flow
            const response = {
              result: {
                access_token,
                refresh_token: refresh_token || undefined,
              },
            };
            handleSuccessfulLogin(response?.result, { remember: false }, router);
            return;
          }
        }


        // Only proceed with login form if user is not authenticated
        // Get prefilled username from URL parameters
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const prefilledUser = searchParams.get("prefilledUsername");
          if (prefilledUser) {
            setPrefilledUsername(prefilledUser);
          }
        }

        if (!localStorage.getItem("did")) {
          const visitorId = await getDeviceId();
          localStorage.setItem(
            "did",
            typeof visitorId === "string" ? visitorId : ""
          );
          console.log("Device fingerprint generated successfully");
        }

        // Show login form only if user is not authenticated
        console.log("📝 Setting showLoginForm to true");
        setShowLoginForm(true);
      } catch (error) {
        console.error("❌ Error in authentication check:", error);
        setShowLoginForm(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    init();
  }, [router]);

  const handleForgotPassword = () => {
    localStorage.setItem("redirectionRoute", "/login");
    router.push("/password-forget");
  };

  const handleLogin = async (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const password = data?.password;

    // Check if there's a redirect URL - if so, skip auth API and use basic login
    const query = new URLSearchParams(window.location.search);
    const redirectUrl = query.get("redirectUrl");

    if (redirectUrl) {
      console.log(
        "Redirect URL detected, skipping auth API and using basic login"
      );
      // For redirect scenarios, create a basic token and proceed
      const basicToken = "basic_token_" + Date.now();
      localStorage.setItem("token", basicToken);

      const response = {
        result: {
          access_token: basicToken,
          user: {
            username: username,
          },
        },
      };

      handleSuccessfulLogin(response?.result, data, router);
      return;
    }

    try {
      const response = await login({ username, password });
      if (response?.result?.access_token) {
        handleSuccessfulLogin(response?.result, data, router);
      } else {
        showToastMessage(
          t("LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT"),
          "error"
        );
        const telemetryInteract = {
          context: { env: "sign-in", cdata: [] },
          edata: {
            id: "login-failed",
            type: "CLICK",
            pageid: "sign-in",
          },
        };
        telemetryFactory.interact(telemetryInteract);
      }
    } catch {
      const errorMessage = t("LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT");
      showToastMessage(errorMessage, "error");
      const telemetryInteract = {
        context: { env: "sign-in", cdata: [] },
        edata: {
          id: "login-failed",
          type: "CLICK",
          pageid: "sign-in",
        },
      };
      telemetryFactory.interact(telemetryInteract);
    }
  };

  const handleVerifyOtp = async (data: {
    username: string;
    otp: string;
    remember: boolean;
    hash: string;
  }) => {
    const username = data?.username;
    const otp = data?.otp;
    const hash = data?.hash;

    try {
      console.log(
        "OTP verification successful, proceeding with login for username:",
        username
      );

      // OTP has already been verified in LoginComponent
      // Now we need to get the actual tokens from the verifyOTP response
      // The verifyOTP response should contain access_token and refresh_token
      const verifyResponse = await verifyOTP({
        mobile: username,
        reason: "login",
        otp: otp,
        hash: hash,
      });

      console.log("OTP verification response:", verifyResponse);

      // Extract tokens from the verifyOTP response
      const access_token =
        verifyResponse?.result?.token || verifyResponse?.result?.access_token;
      const refresh_token = verifyResponse?.result?.refresh_token;

      if (access_token) {
        // Store tokens in localStorage
        localStorage.setItem("token", access_token);
        if (refresh_token) {
          localStorage.setItem("refreshToken", refresh_token);
        }

        // Create response object for handleSuccessfulLogin
        const response = {
          result: {
            access_token: access_token,
            refresh_token: refresh_token,
            user: {
              username: username,
            },
          },
        };

        // Check for redirect URL before calling handleSuccessfulLogin
        const query = new URLSearchParams(window.location.search);
        const redirectUrl = query.get("redirectUrl");


        if (redirectUrl && redirectUrl.startsWith("/")) {
          // For redirect URLs, call auth API and then redirect directly
          await handleSuccessfulLogin(response?.result, data, router);
        } else {
          // For normal login, use the standard flow
          handleSuccessfulLogin(response?.result, data, router);
        }
      } else {
        showToastMessage(
          t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.",
          "error"
        );
      }
    } catch (error: unknown) {
      console.error("Error in OTP login flow:", error);

      // Show generic OTP error
      const errorMessage =
        t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.";
      showToastMessage(errorMessage, "error");
      const telemetryInteract = {
        context: { env: "sign-in", cdata: [] },
        edata: {
          id: "otp-verification-failed",
          type: "CLICK",
          pageid: "sign-in",
        },
      };
      telemetryFactory.interact(telemetryInteract);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          backgroundColor: backgroundColor,
          minHeight: "100vh",
        }}
      >
        <CircularProgress sx={{ color: primaryColor }} />
      </Box>
    );
  }

  // Don't render login form if user is already authenticated
  if (!showLoginForm) {
    return null;
  }

  return (
    <Suspense fallback={
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: backgroundColor,
      }}>
        <CircularProgress sx={{ color: primaryColor }} />
      </Box>
    }>
      <Box
        display="flex"
        flexDirection="column"
        sx={{
          wordBreak: "break-word",
          backgroundColor: backgroundColor,
          minHeight: "100vh",
        }}
      >
        {/* Simple Header with Logo and Tenant Name */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            zIndex: 1000,
            backgroundColor: backgroundColor,
            borderBottom: `1px solid ${secondaryColor}10`,
          }}
        >
          {/* Logo and Brand Name */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            <Box
              sx={{
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tenantIcon.startsWith('data:') ? (
                <img
                  src={tenantIcon}
                  alt={tenantAlt}
                  width={60}
                  height={60}
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <Image
                  src={tenantIcon}
                  alt={tenantAlt}
                  width={60}
                  height={60}
                  style={{ objectFit: "contain" }}
                />
              )}
            </Box>
            <Typography
              sx={{
                fontWeight: 500,
                marginLeft: { xs: 1, sm: 2 },
                fontSize: { xs: "1rem", sm: "1.2rem" },
                lineHeight: "1.4",
                color: secondaryColor,
              }}
            >
              {tenantName}
            </Typography>
          </Box>
          
          {/* Language Dropdown */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LanguageDropdown
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              size="small"
              minWidth={150}
            />
          </Box>
        </Box>

        {/* Main Content: Two Column Layout */}
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            pt: { xs: 8, sm: 10 },
            backgroundColor: backgroundColor,
          }}
        >
          {/* Left Column - Login Form */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: { xs: "flex-start", md: "center" },
              px: { xs: 2, sm: 3, md: 4, lg: 6 },
              py: { xs: 2, sm: 4 },
            }}
          >
            {showLoginForm && (
              <>
                {entryMode === "selection" ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      background: `linear-gradient(180deg, ${alpha(primaryColor, 0.06)} 0%, #ffffff 80%)`,
                      borderRadius: 3,
                      boxShadow: "0 14px 30px rgba(0,0,0,0.07)",
                      border: `1px solid ${alpha(primaryColor, 0.18)}`,
                      p: { xs: 3, sm: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        alignSelf: "center",
                        px: 2,
                        py: 0.75,
                        borderRadius: 999,
                        backgroundColor: alpha(primaryColor, 0.16),
                        color: primaryColor,
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("LEARNER_APP.LOGIN.CHOOSE_MODE") ||
                        "Choose how you want to continue"}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: secondaryColor,
                        textAlign: "center",
                        letterSpacing: 0.2,
                        mt: 0.5,
                      }}
                    >
                      {t("LEARNER_APP.LOGIN.CHOOSE_MODE") ||
                        "Choose how you want to continue"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: alpha(secondaryColor, 0.7),
                        textAlign: "center",
                        maxWidth: 420,
                        mx: "auto",
                        lineHeight: 1.5,
                      }}
                    >
                      {t("LEARNER_APP.LOGIN.LEARNER_OR_WORKSPACE") ||
                        "Login as a learner or go to the workspace portal."}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        mt: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setEntryMode("learner")}
                        sx={{
                          backgroundColor: primaryColor,
                          color: buttonTextColor,
                          fontWeight: 700,
                          py: 1.2,
                          borderRadius: 999,
                          boxShadow: `0 8px 18px ${alpha(primaryColor, 0.25)}`,
                          "&:hover": { backgroundColor: primaryColor },
                        }}
                      >
                        {t("LEARNER_APP.LOGIN.CONTINUE_LEARNER") || "Login as Learner"}
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          window.location.href = "https://admin.sunbirdsaas.com/login";
                        }}
                        sx={{
                          borderColor: primaryColor,
                          color: primaryColor,
                          fontWeight: 700,
                          py: 1.2,
                          borderRadius: 999,
                          "&:hover": {
                            borderColor: primaryColor,
                            backgroundColor: `${primaryColor}10`,
                          },
                        }}
                      >
                        {t("LEARNER_APP.LOGIN.GO_TO_WORKSPACE") || "Go to Workspace"}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <LoginComponent
                      onLogin={handleLogin}
                      onVerifyOtp={handleVerifyOtp}
                      handleForgotPassword={handleForgotPassword}
                      handleAddAccount={handleAddAccount}
                      prefilledUsername={prefilledUsername}
                      onRedirectToLogin={() => {
                        // Show error message for unregistered user
                        showToastMessage(
                          "User not registered. Please contact your administrator to register your account.",
                          "error"
                        );
                        console.log("User not registered - showing error message");
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        mt: { xs: 1, sm: 0.5 },
                        pt: 1,
                        borderTop: `1px solid ${alpha(secondaryColor, 0.08)}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: primaryColor,
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() => {
                          window.location.href = "https://admin.sunbirdsaas.com/login";
                        }}
                      >
                        {t("LEARNER_APP.LOGIN.GO_TO_WORKSPACE") || "Go to Workspace"} →
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Right Column - Logo */}
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              justifyContent: "center",
              px: 4,
              py: 4,
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "80%",
                backgroundColor: "white",
                border: `1px solid ${primaryColor}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 6px ${primaryColor}20`,
              }}
            >
              {/* Logo */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  p: 4,
                }}
              >
                {tenantIcon.startsWith('data:') ? (
                  <img
                    src={tenantIcon}
                    alt={tenantAlt}
                    width={300}
                    height={300}
                    style={{ 
                      objectFit: "contain",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                ) : (
                  <Image
                    src={tenantIcon}
                    alt={tenantAlt}
                    width={300}
                    height={300}
                    style={{ 
                      objectFit: "contain",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Suspense>
  );
};

export default LoginPage;