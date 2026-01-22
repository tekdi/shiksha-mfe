/* eslint-disable @typescript-eslint/no-empty-function */
"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @nx/enforce-module-boundaries */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";

import { Layout, useTranslation } from "@shared-lib";
import { useTenant } from "@learner/context/TenantContext";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import { getLocalizedText } from "@learner/utils/API/TenantService";
import { getUserId, login } from "@learner/utils/API/LoginService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";
import { sendOTP, verifyOTP } from "@learner/utils/API/OtPService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { ensureAcademicYearForTenant } from "@learner/utils/API/ProgramService";

/* ---------------- Helper ---------------- */

// Safe translation helper: if translation key is missing (returns same key), use fallback
const translateWithFallback = (
  tFn: (key: string) => string,
  key: string,
  fallback: string
) => {
  try {
    const value = tFn(key);
    if (!value || value === key) {
      return fallback;
    }
    return value;
  } catch {
    return fallback;
  }
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

/* ---------------- LoginComponent (Updated UI) ---------------- */

interface LoginComponentProps {
  onLogin: (data: { username: string; password: string; remember: boolean }) => void;
  onVerifyOtp?: (data: { username: string; otp: string; remember: boolean; hash: string }) => void;
  handleForgotPassword?: () => void;
  prefilledUsername?: string;
  onRedirectToLogin?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const LoginComponent: React.FC<LoginComponentProps> = ({
  onLogin,
  onVerifyOtp,
  handleForgotPassword,
  prefilledUsername,
  onRedirectToLogin,
  onBack,
  isLoading = false,
}) => {
  const { t, language } = useTranslation();
  const { contentFilter, tenant } = useTenant();

  // Determine login method from tenant config
  // Force OTP for Swadhaar tenant
  const tenantNameRaw = contentFilter?.title || tenant?.name || "";
  const tenantNameStr = getLocalizedText(tenantNameRaw, language, "");
  const isSwadhaar = tenantNameStr.toLowerCase().includes("swadhaar");
  const loginMethod = isSwadhaar ? "otp" : (contentFilter?.loginMethod || "otp");
  const isOtpLoginMethod = loginMethod === "otp";

  const primaryColor = contentFilter?.theme?.primaryColor || "#6B2E91";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const buttonTextColor =
    contentFilter?.buttonTextColor ||
    contentFilter?.theme?.buttonTextColor ||
    "#FFFFFF";

  const tenantIcon = contentFilter?.icon || "/logo.png";

  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forcePasswordMode, setForcePasswordMode] = useState(!isOtpLoginMethod);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpHash, setOtpHash] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const hasInitializedRef = useRef(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
    remember: false,
  });

  // Check if username is a mobile number
  const isMobileNumber = (username: string) => {
    return /^\d{10,}$/.test(username);
  };

  // Process mobile number to handle country code
  const processMobileNumber = (mobile: string): string => {
    if (mobile.length === 12 && mobile.startsWith("91")) {
      return mobile.substring(2);
    }
    return mobile;
  };

  // Determine if we should show OTP mode
  const isOtpMode = isOtpLoginMethod && otpSent && !forcePasswordMode;

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

        // Get domainTenantId - priority: localStorage (set when tenant loaded), then tenant context
        let domainTenantId: string | null = null;
        if (typeof window !== "undefined") {
          domainTenantId = localStorage.getItem("domainTenantId");
        }
        if (!domainTenantId) {
          domainTenantId = tenant?.tenantId || null;
        }
        
        if (!domainTenantId) {
          console.error("No tenant found for this domain");
          showToastMessage(
            "Tenant configuration not found. Please contact administrator.",
            "error"
          );
          return;
        }
        
        // First check if user exists with the specific tenant ID
        const userCheckResponse = await checkUserExistenceWithTenant(
          processedMobile,
          domainTenantId
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
          // Check user status - only allow OTP for active users
          const userStatus = (userWithTargetTenant as any)?.status;
          if (userStatus && String(userStatus).toLowerCase() !== "active") {
            console.log("User is not active, skipping OTP:", {
              mobile: processedMobile,
              status: userStatus,
            });
            showToastMessage(
              t("LEARNER_APP.LOGIN.USER_ARCHIVED") ||
                "Your account is not active. Please contact your administrator.",
              "error"
            );
            // Allow user to try a different number
            setHasCheckedUser(false);
            return;
          }

          console.log("Active user found, sending OTP:", userWithTargetTenant);
          // User exists and is active, send OTP for login
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

  useEffect(() => {
    if (prefilledUsername && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setFormData((prev) => ({
        ...prev,
        username: prefilledUsername,
      }));

      const existingToken =
        localStorage.getItem("token") || getCookieValue("token");

      if (!existingToken && isMobileNumber(prefilledUsername) && isOtpLoginMethod) {
        sendOtp(prefilledUsername);
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
      onVerifyOtp({
        username: formData.username,
        otp: formData.otp,
        remember: formData.remember,
        hash: otpHash,
      });
    } else if (onLogin) {
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

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue.length > 1) {
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
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      if (numericValue || value === "") {
        const newOtp = formData.otp.split("");
        newOtp[index] = numericValue;
        setFormData((prev) => ({
          ...prev,
          otp: newOtp.join("").slice(0, 6),
        }));
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
    const numericValue = pastedData.replace(/\D/g, "");
    
    if (numericValue.length > 0) {
      const digits = numericValue.slice(0, 6).split("");
      const newOtp = new Array(6).fill("");
      
      digits.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      
      setFormData((prev) => ({
        ...prev,
        otp: newOtp.join(""),
      }));
      
      const nextIndex = Math.min(digits.length - 1, 5);
      if (nextIndex >= 0) {
        setTimeout(() => {
          otpRefs.current[nextIndex]?.focus();
        }, 0);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendAttempts >= 2) {
      showToastMessage(
        "Maximum resend attempts reached. Please try again later.",
        "error"
      );
      return;
    }

    if (resendTimer > 0) {
      return;
    }

    if (formData.username && isMobileNumber(formData.username)) {
      setResendTimer(120);
      setResendAttempts((prev) => prev + 1);
      setHasCheckedUser(false);
      
      const processedMobile = processMobileNumber(formData.username);
      setIsSendingOtp(true);
      
      try {
        const response = await sendOTP({
          mobile: processedMobile,
          reason: "login",
        });

        if (response?.result?.data?.hash) {
          setOtpHash(response.result.data.hash);
        }
        setFormData((prev) => ({
          ...prev,
          otp: "",
        }));
        showToastMessage("OTP resent successfully", "success");
      } catch (error) {
        console.error("Error resending OTP:", error);
        showToastMessage("Failed to resend OTP. Please try again.", "error");
        setResendAttempts((prev) => Math.max(0, prev - 1));
      } finally {
        setIsSendingOtp(false);
        setHasCheckedUser(true);
      }
    }
  };

  /* ---------------- UI BLOCK ---------------- */

  // Password login method
  if (!isOtpLoginMethod) {
    return (
      <Box sx={{ width: "100%", px: { xs: 1, sm: 2 } }}>
        {/* Back Button */}
        {onBack && (
          <Box sx={{ width: "100%", textAlign: "left", mb: 2 , mt: -1}}>
            <IconButton onClick={onBack} sx={{ color: secondaryColor }}>
              <ArrowBack />
            </IconButton>
          </Box>
        )}

        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 1.5, sm: 2 } }}>
          <Image
            src={tenantIcon}
            width={70}
            height={70}
            alt="tenant-logo"
            style={{ 
              objectFit: "contain",
              width: "clamp(60px, 15vw, 70px)",
              height: "auto"
            }}
          />
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            color: secondaryColor,
            mb: { xs: 0.75, sm: 1 },
            textAlign: "center",
            lineHeight: { xs: 1.2, sm: 1.3 },
          }}
        >
          {translateWithFallback(t, "LEARNER_APP.LOGIN.LOGIN", "Welcome Back")}
        </Typography>

        <Typography
          sx={{
            color: "rgba(0,0,0,0.65)",
            mb: { xs: 3, sm: 4 },
            textAlign: "center",
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          {translateWithFallback(
            t,
            "LEARNER_APP.LOGIN.LOG_IN_AS_LEARNER_SUBTITLE",
            "Log in as a learner"
          )}
        </Typography>

        {/* Username Field */}
        <TextField
          label={translateWithFallback(
            t,
            "LEARNER_APP.LOGIN.username_label",
            "Username"
          )}
          name="username"
          value={formData.username}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="normal"
          autoFocus
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
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
          label={translateWithFallback(
            t,
            "LEARNER_APP.LOGIN.password_label",
            "Password"
          )}
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
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
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
          disabled={isLoading}
          fullWidth
          sx={{
            py: { xs: 1.4, sm: 1.6 },
            backgroundColor: primaryColor,
            color: `${buttonTextColor} !important`,
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: { xs: "0.95rem", sm: "1rem" },
            boxShadow: `0 4px 14px ${alpha(primaryColor, 0.35)}`,
            mb: { xs: 1.5, sm: 2 },
            textTransform: "none",
            "&:hover": {
              backgroundColor: primaryColor,
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: alpha(primaryColor, 0.6),
              color: `${buttonTextColor} !important`,
              opacity: 0.8,
            },
          }}
        >
          {isLoading ? (
            <Box display="flex" alignItems="center" gap={1} justifyContent="center">
              <CircularProgress size={20} sx={{ color: buttonTextColor }} />
              <span>
                {translateWithFallback(
                  t,
                  "LEARNER_APP.LOGIN.LOGGING_IN",
                  "Logging in..."
                )}
              </span>
            </Box>
          ) : (
            translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.login_button",
              "Login"
            )
          )}
        </Button>

        {/* {handleForgotPassword && (
          <Button
            onClick={handleForgotPassword}
            sx={{
              textTransform: "none",
              color: primaryColor,
              fontSize: "0.875rem",
            }}
          >
            Forgot Password?
          </Button>
        )} */}
      </Box>
    );
  }

  // OTP Login Method
  return (
    <Box sx={{ width: "100%", px: { xs: 1, sm: 2 } }}>
      {/* Back Button */}
      {onBack && !isOtpMode && (
        <Box sx={{ width: "100%", textAlign: "left", mb: 2, mt: -1 }}>
          <IconButton onClick={onBack} sx={{ color: secondaryColor }}>
            <ArrowBack />
          </IconButton>
        </Box>
      )}

      {/* Logo */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 1.5, sm: 2 } }}>
        <Image
          src={tenantIcon}
          width={70}
          height={70}
          alt="tenant-logo"
          style={{ 
            objectFit: "contain",
            width: "clamp(60px, 15vw, 70px)",
            height: "auto"
          }}
        />
      </Box>

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          color: secondaryColor,
          mb: { xs: 0.75, sm: 1 },
          textAlign: "center",
          lineHeight: { xs: 1.2, sm: 1.3 },
        }}
      >
        {translateWithFallback(t, "LEARNER_APP.LOGIN.LOGIN", "Welcome Back")}
      </Typography>

      <Typography
        sx={{
          color: "rgba(0,0,0,0.65)",
          mb: { xs: 3, sm: 4 },
          textAlign: "center",
          fontSize: { xs: "0.875rem", sm: "1rem" },
        }}
      >
        {translateWithFallback(
          t,
          "LEARNER_APP.LOGIN.LOG_IN_AS_LEARNER_SUBTITLE",
          "Log in as a learner"
        )}
      </Typography>

      {!isOtpMode ? (
        // Phone Number Step
        <>
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: "13px", sm: "14px", md: "15px", lg: "16px" },
              color: secondaryColor,
              mb: { xs: 2.5, sm: 3 },
              textAlign: "center",
              lineHeight: { xs: 1.5, sm: 1.6 },
              px: { xs: 1, sm: 0 },
            }}
          >
            👋{" "}
            {translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.PHONE_INSTRUCTION",
              "Hi there! Log in with your registered phone number to continue."
            )}
          </Typography>

          <TextField
            name="username"
            label={translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.PHONE_NUMBER",
              "Phone Number"
            )}
            value={formData.username}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              setFormData((prev) => ({
                ...prev,
                username: value,
              }));
              if (hasCheckedUser) {
                setHasCheckedUser(false);
              }
            }}
            placeholder="+91 0000000000"
            variant="outlined"
            fullWidth
            margin="normal"
            autoFocus
            inputProps={{
              maxLength: 10,
              pattern: "[0-9]*",
              inputMode: "numeric",
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
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

          <Button
            onClick={handleSendOtp}
            disabled={!formData.username || isSendingOtp || formData.username.length !== 10}
            fullWidth
            sx={{
              py: { xs: 1.4, sm: 1.6 },
              backgroundColor: primaryColor,
              color: `${buttonTextColor} !important`,
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              boxShadow: `0 4px 14px ${alpha(primaryColor, 0.35)}`,
              mb: { xs: 1.5, sm: 2 },
              textTransform: "none",
              "&:hover": {
                backgroundColor: primaryColor,
                opacity: 0.9,
              },
              "&:disabled": {
                backgroundColor: backgroundColor,
                color: secondaryColor,
                opacity: 0.5,
              },
            }}
          >
            {isSendingOtp ? (
              <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                <CircularProgress size={20} sx={{ color: buttonTextColor }} />
                <span>
                  {translateWithFallback(
                    t,
                    "LEARNER_APP.LOGIN.SENDING",
                    "Sending..."
                  )}
                </span>
              </Box>
            ) : (
              translateWithFallback(
                t,
                "LEARNER_APP.LOGIN.SEND_OTP",
                "SEND OTP"
              )
            )}
          </Button>
        </>
      ) : (
        // OTP Verification Step
        <>
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: "13px", sm: "14px", md: "15px", lg: "16px" },
              color: secondaryColor,
              mb: { xs: 2.5, sm: 3 },
              textAlign: "center",
              lineHeight: { xs: 1.5, sm: 1.6 },
              px: { xs: 1, sm: 0 },
            }}
          >
            {translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.OTP_INSTRUCTION",
              "Enter the 6-digit OTP sent to your phone."
            )}
          </Typography>

          {/* OTP Input Boxes */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, sm: 0.75, md: 1, lg: 1.25 },
              justifyContent: "center",
              mb: { xs: 3, sm: 4 },
              flexWrap: "nowrap",
              overflowX: "auto",
              px: { xs: 1, sm: 0 },
              "&::-webkit-scrollbar": {
                display: "none",
              },
              scrollbarWidth: "none",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <TextField
                key={idx}
                inputRef={(el) => (otpRefs.current[idx] = el)}
                value={formData.otp[idx] || ""}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                autoFocus={idx === 0}
                inputProps={{
                  maxLength: 1,
                  inputMode: "numeric",
                  style: { 
                    textAlign: "center", 
                    fontWeight: 700 
                  },
                }}
                sx={{
                  width: { xs: 42, sm: 48, md: 52, lg: 56 },
                  minWidth: { xs: 42, sm: 48, md: 52, lg: 56 },
                  height: { xs: 48, sm: 52, md: 56 },
                  flexShrink: 0,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    height: "100%",
                    padding: 0,
                  },
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "18px", sm: "20px" },
                    padding: { xs: "14px 8px", sm: "16px 8px", md: "18px 8px" },
                    textAlign: "center",
                    lineHeight: 1.2,
                    height: "100%",
                    boxSizing: "border-box",
                  },
                }}
              />
            ))}
          </Box>

          <Button
            onClick={handleSubmit}
            disabled={formData.otp.length !== 6 || isLoading}
            fullWidth
            sx={{
              py: { xs: 1.4, sm: 1.6 },
              backgroundColor: primaryColor,
              color: `${buttonTextColor} !important`,
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              boxShadow: `0 4px 14px ${alpha(primaryColor, 0.35)}`,
              mb: { xs: 1.5, sm: 2 },
              textTransform: "none",
              "&:hover": {
                backgroundColor: primaryColor,
                opacity: 0.9,
              },
              "&:disabled": {
                backgroundColor: isLoading ? alpha(primaryColor, 0.6) : backgroundColor,
                color: isLoading ? `${buttonTextColor} !important` : secondaryColor,
                opacity: 0.8,
              },
            }}
          >
            {isLoading ? (
              <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                <CircularProgress size={20} sx={{ color: buttonTextColor }} />
                <span>
                  {translateWithFallback(
                    t,
                    "LEARNER_APP.LOGIN.VERIFYING",
                    "Verifying..."
                  )}
                </span>
              </Box>
            ) : (
              translateWithFallback(
                t,
                "LEARNER_APP.LOGIN.ENTER_OTP",
                "ENTER OTP"
              )
            )}
          </Button>

          {/* Resend OTP */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: { xs: 1, sm: 0 } }}>
            <Tooltip
              title={
                translateWithFallback(
                  t,
                  "LEARNER_APP.LOGIN.RESEND_OTP_HINT",
                  "Didn’t receive the code? You can request a new OTP in a few seconds"
                )
              }
              arrow
              placement="top"
              disableHoverListener={resendAttempts >= 2}
            >
              <span>
                <Button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || resendAttempts >= 2}
                  sx={{
                    textTransform: "none",
                    color: resendAttempts >= 2 ? "#999999" : primaryColor,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
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
                    ? translateWithFallback(
                        t,
                        "LEARNER_APP.LOGIN.RESEND_OTP_DISABLED",
                        "Resend OTP (Limit Reached)"
                      )
                    : resendTimer > 0
                    ? `${translateWithFallback(
                        t,
                        "LEARNER_APP.LOGIN.RESEND_OTP",
                        "Resend OTP"
                      )} (${Math.floor(resendTimer / 60)}:${String(
                        resendTimer % 60
                      ).padStart(2, "0")})`
                    : translateWithFallback(
                        t,
                        "LEARNER_APP.LOGIN.RESEND_OTP",
                        "Resend OTP"
                      )}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );
};
/* ---------------- Backgrounds / Effects ---------------- */

const ConcentricRingsBackground = ({ primaryColor, secondaryColor, backgroundColor = "#ffffff" }: { primaryColor: string; secondaryColor: string; backgroundColor?: string }) => {
  const left = {
    width: "82%",
    height: "140%",
    top: "4%",
    left: "-38%",
    ringAlpha: 0.06,
    ringThickness: 1.4,
    ringGap: 26,
    blur: 1.2,
    center: "36% 52%",
  };

  const right = {
    width: "56%",
    height: "116%",
    top: "2%",
    right: "-8%",
    ringAlpha: 0.115,
    ringThickness: 2,
    ringGap: 12,
    blur: 0.6,
    center: "78% 58%",
  };

  return (
    <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <Box sx={{
        position: "absolute",
        width: left.width,
        height: left.height,
        top: left.top,
        left: left.left,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundImage: `
          repeating-radial-gradient(circle at ${left.center},
            ${alpha(primaryColor, left.ringAlpha)} 0px,
            ${alpha(primaryColor, left.ringAlpha)} ${left.ringThickness}px,
            transparent ${left.ringThickness + 0.6}px,
            transparent ${left.ringGap}px
          ),
          radial-gradient(circle at ${left.center}, ${alpha(primaryColor, 0.03)} 0%, transparent 36%),
          radial-gradient(circle at ${left.center}, ${backgroundColor} 0%, ${backgroundColor} 14%, transparent 15%)
        `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        filter: `blur(${left.blur}px)`,
      }} />

      <Box sx={{
        position: "absolute",
        width: right.width,
        height: right.height,
        top: right.top,
        right: right.right,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundImage: `
          repeating-radial-gradient(circle at ${right.center},
            ${alpha(secondaryColor, right.ringAlpha)} 0px,
            ${alpha(secondaryColor, right.ringAlpha)} ${right.ringThickness}px,
            transparent ${right.ringThickness + 0.4}px,
            transparent ${right.ringGap}px
          ),
          radial-gradient(circle at ${right.center}, ${alpha(secondaryColor, 0.05)} 0%, transparent 42%),
          radial-gradient(circle at ${right.center}, ${backgroundColor} 0%, ${backgroundColor} 10%, transparent 11%)
        `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        filter: `blur(${right.blur}px)`,
      }} />

      <Box sx={{
        position: "absolute",
        left: "28%",
        top: "16%",
        width: "46%",
        height: "58%",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0,
        background: `radial-gradient(circle at 50% 40%, ${alpha(backgroundColor, 0.98)} 0%, ${alpha(backgroundColor, 0.86)} 8%, transparent 48%)`,
        filter: "blur(18px)",
        opacity: 0.98,
      }} />
    </Box>
  );
};


/* ---------------- Floating Icons ---------------- */

const FloatingIconsOverlay = ({ primaryColor }: { primaryColor: string }) => (
  <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}>
    <Box sx={{ position: "absolute", top: "12%", left: "46%", opacity: 0.16 }}>
      ✨
    </Box>
    <Box sx={{ position: "absolute", bottom: "14%", right: "18%", opacity: 0.16 }}>
      📖
    </Box>
  </Box>
);

/* ---------------- Left Column (HIDE OUR SOLUTIONS IF EMPTY) ---------------- */

const HomeLeftColumn = ({ features, description, tagline, uiSecondaryColor, t }: any) => {
  const hasSolutions = Array.isArray(features) && features.length > 0;

  return (
  <Box
    sx={{
      flex: { xs: "0 0 auto", lg: 1 },
      px: { xs: 2, sm: 3, md: 6, lg: 10, xl: 16 },
      display: "flex",
      flexDirection: "column",
      justifyContent: { xs: "flex-start", lg: "center" },
      py: { xs: 2, sm: 3, md: 4 },
      minHeight: { xs: "auto", lg: "100%" },
      width: { xs: "100%", lg: "auto" },
      maxWidth: { xs: "100%", lg: "none" }, // Prevent overflow on mobile
      zIndex: 2,
      pt: { xs: 2, sm: 2 }, // Add top padding on mobile to prevent touching header
      pb: { xs: 2, sm: 1, md: 4 }, // Add bottom padding on mobile
      order: { xs: 1, lg: 0 },
      maxHeight: { xs: "none", lg: "100%" },
      overflow: { xs: "visible", lg: "auto" },
      overflowX: "hidden", // Prevent horizontal scroll
      boxSizing: "border-box", // Include padding in width calculation
    }}
  >
      {/* TITLE */}
      {description && (
        <Typography
          sx={{
            fontWeight: 700,
            color: uiSecondaryColor,
            mb: { xs: 1.5, sm: 2 }, // Increased spacing on mobile
            fontSize: { xs: "1.75rem", sm: "2.2rem", md: "2.5rem", lg: "3rem" },
            lineHeight: { xs: 1.2, sm: 1.3 },
            wordWrap: "break-word", // Prevent text overflow
            overflowWrap: "break-word", // Prevent text overflow
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {description}
        </Typography>
      )}

      {tagline && (
        <Typography
          sx={{
            color: "rgba(0,0,0,0.7)",
            mb: { xs: 3, sm: 4 }, // Increased spacing on mobile
            fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
            maxWidth: { xs: "100%", sm: "600px" }, // Full width on mobile
            lineHeight: { xs: 1.5, sm: 1.6 },
            wordWrap: "break-word", // Prevent text overflow
            overflowWrap: "break-word", // Prevent text overflow
            width: "100%",
          }}
        >
          {tagline}
        </Typography>
      )}

      {/* Our Solutions — ONLY IF AVAILABLE */}
      {hasSolutions && (
        <>
          <Typography
            sx={{
              fontWeight: 700,
              mb: { xs: 2, sm: 2 }, // Increased spacing on mobile
              fontSize: { xs: "1.4rem", sm: "1.5rem", md: "1.7rem" },
              color: uiSecondaryColor,
            }}
          >
            {t("LEARNER_APP.HOME.OUR_SOLUTIONS_TITLE") || "Our Solutions"}
          </Typography>

        <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}> {/* Increased spacing on mobile to prevent overlap */}
  {features.map((f: any) => (
    <Grid item xs={12} sm={6} key={f.title} sx={{ display: "flex", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <Card
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: { xs: "12px", sm: "18px" },
          boxShadow: `0 6px 22px ${alpha(uiSecondaryColor, 0.1)}`,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,         // ⭐ makes all cards equal height
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden", // Prevent content overflow
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: { xs: "12px !important", sm: "16px !important" } }}>  {/* ⭐ helps content stretch */}
          <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 }, alignItems: "center" }}>
            <Image 
              src={f.icon} 
              alt={f.title} 
              width={42} 
              height={42}
              style={{ 
                width: "clamp(36px, 8vw, 42px)",
                height: "auto"
              }}
            />
            <Typography
              sx={{
                fontWeight: 600,
                color: uiSecondaryColor,
                fontSize: { xs: "0.95rem", sm: "1rem", md: "1.2rem" },
              }}
            >
              {f.title}
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: { xs: 1, sm: 1.2 },
              color: "rgba(0,0,0,0.6)",
              fontSize: { xs: "0.875rem", sm: "0.95rem", md: "1rem" },
              lineHeight: { xs: 1.5, sm: 1.6 },
            }}
          >
            {f.description}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>

        </>
      )}
    </Box>
  );
};
/* ---------------- Right Column ---------------- */

interface RightProps {
  entryMode: "selection" | "learner";
  setEntryMode: (v: "selection" | "learner") => void;
  tenantIcon: string;
  uiPrimaryColor: string;
  uiSecondaryColor: string;
  t: (key: string) => string;
  onLogin: (data: { username: string; password: string; remember: boolean }) => void;
  onVerifyOtp: (data: { username: string; otp: string; remember: boolean; hash: string }) => void;
  handleForgotPassword?: () => void;
  prefilledUsername?: string;
  onRedirectToLogin?: () => void;
  isLoading?: boolean;
}

const HomeRightColumn = ({
  entryMode,
  setEntryMode,
  tenantIcon,
  uiPrimaryColor,
  uiSecondaryColor,
  t,
  onLogin,
  onVerifyOtp,
  handleForgotPassword,
  prefilledUsername,
  onRedirectToLogin,
  isLoading = false,
}: RightProps) => (
  <Box
    sx={{
      flex: { xs: "0 0 auto", lg: 1 },
      display: "flex",
      justifyContent: "center",
      alignItems: { xs: "flex-start", sm: "center" }, // Mobile: flex-start, Tablet/Web: center
      px: { xs: 2, sm: 2, md: 4, lg: 6, xl: 8 },
      py: { xs: 0, sm: 3, lg: 0 },
      minHeight: { xs: "auto", sm: "100%" }, // Mobile: auto, Tablet/Web: 100%
      width: { xs: "100%", lg: "auto" },
      maxWidth: { xs: "100%", lg: "none" }, // Prevent overflow on mobile
      zIndex: 3,
      pt: 0,
      pb: 0,
      order: { xs: 2, lg: 0 },
      flexShrink: 0,
      position: { xs: "relative", lg: "static" },
      overflowX: "hidden", // Prevent horizontal scroll
      boxSizing: "border-box", // Include padding in width calculation
    }}
  >
    <Card
      sx={{
        width: "100%",
        maxWidth: "520px",
        mx: "auto",
        borderRadius: { xs: "20px", sm: "26px" },
        background: "#ffffff",
        boxShadow: "0 14px 38px rgba(0,0,0,0.14)",
        p: { xs: 2, sm: 3, md: 4 },

        /* RESPONSIVE HEIGHT - mobile card hugs content, restore tablet/desktop */
        minHeight: { xs: "auto", sm: 600, md: 730 },
        display: "flex",
        flexDirection: "column",
        justifyContent: { xs: "flex-start", sm: "center" }, // Mobile: flex-start, Web: center
        alignItems: "center",

        textAlign: "center",
        position: "relative",
        zIndex: 1,
        mb: 0,
        mt: 0,
        boxSizing: "border-box", // Include padding in width calculation
        overflow: "hidden", // Prevent content overflow
      }}
    >
      {entryMode === "selection" ? (
        <>
          <Box sx={{ mt: { xs: 0, sm: -4, md: -6 }, mb: { xs: 1.5, sm: 2.5 } }}>
            <Image
              src={tenantIcon}
              width={130}
              height={130}
              alt="tenant-logo"
              style={{ 
                objectFit: "contain",
                width: "clamp(80px, 20vw, 130px)",
                height: "auto"
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              fontWeight: 700,
              mb: { xs: 0.5, sm: 1 },
              color: uiSecondaryColor,
            }}
          >
            {translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.LOGIN",
              "Welcome Back"
            )}
          </Typography>

          <Typography
            sx={{
              color: "rgba(0,0,0,0.65)",
              mb: { xs: 2, sm: 4 },
              fontSize: { xs: "0.9rem", sm: "1rem" },
            }}
          >
            {translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.LEARNER_OR_WORKSPACE",
              "Sign in to your Account"
            )}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: uiPrimaryColor,
              py: { xs: 1.4, sm: 1.6 },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              mb: { xs: 1.5, sm: 2.5 },
              fontSize: { xs: "0.95rem", sm: "1rem" },
            }}
            onClick={() => setEntryMode("learner")}
          >
            {translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.CONTINUE_LEARNER",
              "Log in as a Learner"
            )}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            sx={{
              borderColor: uiPrimaryColor,
              py: { xs: 1.3, sm: 1.5 },
              borderRadius: "10px",
              fontWeight: 600,
              textTransform: "none",
              fontSize: { xs: "0.95rem", sm: "1rem" },
            }}
            onClick={() =>
              (window.location.href = "https://admin.sunbirdsaas.com/login")
            }
          >
            {translateWithFallback(
              t,
              "LEARNER_APP.LOGIN.GO_TO_WORKSPACE",
              "Log in to the Workspace"
            )}
          </Button>
        </>
      ) : (
        <LoginComponent
          onLogin={onLogin}
          onVerifyOtp={onVerifyOtp}
          handleForgotPassword={handleForgotPassword}
          prefilledUsername={prefilledUsername}
          onRedirectToLogin={onRedirectToLogin}
          onBack={() => setEntryMode("selection")}
          isLoading={isLoading}
        />
      )}
    </Card>
  </Box>
);

/* ---------------- Page ---------------- */

export default function Index() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { tenant, contentFilter, isLoading } = useTenant();

  const uiPrimaryColor = contentFilter?.theme?.primaryColor || "#5B2E91";
  const uiSecondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor =
    contentFilter?.backgroundColor ||
    contentFilter?.theme?.backgroundColor ||
    "#ffffff";

  const tenantNameRaw = contentFilter?.title || tenant?.name;
  const tenantName = typeof tenantNameRaw === "string"
    ? tenantNameRaw
    : getLocalizedText(tenantNameRaw, language, "");

  const tenantIcon = contentFilter?.icon || "/logo.png";

  const description = getLocalizedText(
    contentFilter?.description,
    language,
    ""
  );

  const isSwadhaarTenant =
    typeof tenantName === "string" &&
    tenantName.toLowerCase().includes("swadhaar");

  const headingDescription = isSwadhaarTenant
    ? language === "hi"
      ? "स्वाधार फिनएक्सेस में आपका स्वागत है!"
      : "Welcome to Swadhaar FinAccess!"
    : description;

  const tagline = getLocalizedText(
    contentFilter?.tagline,
    language,
    ""
  );

  const features = useMemo(() => {
    if (!contentFilter?.ourSolutions) return [];
    if (!Array.isArray(contentFilter.ourSolutions)) return [];
    if (contentFilter.ourSolutions.length === 0) return [];

    return contentFilter.ourSolutions.map((s: any) => ({
      icon: s.icon,
      title: getLocalizedText(s.title, language, ""),
      description: getLocalizedText(s.description, language, ""),
    }));
  }, [contentFilter, language]);

  const [entryMode, setEntryMode] = useState<"selection" | "learner">(
    "selection"
  );
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleSuccessfulLogin = async (
    response: { access_token: string; refresh_token?: string },
    data: { remember: boolean },
    router: { push: (url: string) => void }
  ) => {
    // Keep isAuthLoading = true here so the loader continues until navigation completes.
    if (typeof window !== "undefined" && window.localStorage) {
      const token = response.access_token;
      const refreshToken = response?.refresh_token;
      localStorage.setItem("token", token);
      data?.remember && refreshToken
        ? localStorage.setItem("refreshToken", refreshToken)
        : localStorage.removeItem("refreshToken");

      const userResponse = await getUserId();

      if (!userResponse) {
        return;
      }

      if (userResponse) {
        const userTenantId = userResponse?.tenantData?.[0]?.tenantId;
        const domainTenantId = tenant?.tenantId;
        
        if (!domainTenantId) {
          showToastMessage(
            "Tenant configuration not found. Please contact administrator.",
            "error"
          );
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
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return;
        }
        
        const userRole = userResponse?.tenantData?.[0]?.roleName;

        if (userRole === "Learner" || userRole === "Teacher" || userRole === "Staff" || userRole === "Supervisor") {
          localStorage.setItem("userId", userResponse?.userId);
          localStorage.setItem(
            "templtateId",
            userResponse?.tenantData?.[0]?.templateId
          );
          localStorage.setItem("userIdName", userResponse?.username);
          localStorage.setItem("mobileNumber", userResponse?.mobile || "");
          localStorage.setItem("firstName", userResponse?.firstName || "");
          localStorage.setItem("userRole", userRole);

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

          const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
          if (redirectAfterLogin && redirectAfterLogin.startsWith("/")) {
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = `${window.location.origin}${redirectAfterLogin}`;
          } else {
            window.location.href = `${window.location.origin}/dashboard?tab=1`;
          }
          return;
        } else if (
          userRole === "Creator" ||
          userRole === "Reviewer" ||
          userRole === "Admin"
        ) {
          localStorage.setItem("userId", userResponse?.userId);
          localStorage.setItem("userIdName", userResponse?.username);
          localStorage.setItem("firstName", userResponse?.firstName || "");
          localStorage.setItem("userRole", userRole);

          const tenantId = userResponse?.tenantData?.[0]?.tenantId;
          const tenantName = userResponse?.tenantData?.[0]?.tenantName;
          localStorage.setItem("tenantId", tenantId);
          localStorage.setItem("userProgram", tenantName);

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

          localStorage.setItem("ssoData", JSON.stringify(ssoData));
          document.cookie = `sso_token=${token}; path=/; secure; SameSite=Lax`;
          document.cookie = `user_data=${JSON.stringify(ssoData)}; path=/; secure; SameSite=Lax`;

          window.location.href = `${window.location.origin.replace("3003", "3002")}/login`;
          return;
        } else {
          showToastMessage(
            "User role not recognized. Please contact administrator.",
            "error"
          );
        }
      }
    }
  };

  const handleLogin = async (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const password = data?.password;

    const query = new URLSearchParams(window.location.search);
    const redirectUrl = query.get("redirectUrl");

    if (redirectUrl) {
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
      setIsAuthLoading(true);
      const response = await login({ username, password });
      if (response?.result?.access_token) {
        handleSuccessfulLogin(response?.result, data, router);
      } else {
        showToastMessage(
          t("LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT") || "Invalid username or password",
          "error"
        );
        setIsAuthLoading(false);
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      // Check for specific error response structure
      const errorResponse = error as {
        response?: {
          status?: number;
          data?: {
            responseCode?: number;
            params?: {
              status?: string;
              err?: string;
              errmsg?: string;
            };
          };
        };
      };

      // Check if it's a 400/500 error with failed status
      const isUserNotActiveError =
        errorResponse?.response?.status === 400 ||
        errorResponse?.response?.status === 500 ||
        errorResponse?.response?.data?.responseCode === 400 ||
        errorResponse?.response?.data?.responseCode === 500 ||
        (errorResponse?.response?.data?.params?.status === "failed" &&
          (errorResponse?.response?.data?.params?.err?.includes("400") ||
            errorResponse?.response?.data?.params?.err?.includes("500")));

      if (isUserNotActiveError) {
        showToastMessage(
          "This user is not active Please contact your administrator.",
          "error"
        );
      } else {
        const errorMessage =
          t("LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT") ||
          "Invalid username or password";
        showToastMessage(errorMessage, "error");
      }
      setIsAuthLoading(false);
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
      setIsAuthLoading(true);
      const verifyResponse = await verifyOTP({
        mobile: username,
        reason: "login",
        otp: otp,
        hash: hash,
      });

      const access_token =
        verifyResponse?.result?.token || verifyResponse?.result?.access_token;
      const refresh_token = verifyResponse?.result?.refresh_token;

      if (access_token) {
        localStorage.setItem("token", access_token);
        if (refresh_token) {
          localStorage.setItem("refreshToken", refresh_token);
        }

        const response = {
          result: {
            access_token: access_token,
            refresh_token: refresh_token,
            user: {
              username: username,
            },
          },
        };

        const query = new URLSearchParams(window.location.search);
        const redirectUrl = query.get("redirectUrl");

        if (redirectUrl && redirectUrl.startsWith("/")) {
          await handleSuccessfulLogin(response?.result, data, router);
        } else {
          handleSuccessfulLogin(response?.result, data, router);
        }
      } else {
        showToastMessage(
          t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.",
          "error"
        );
        setIsAuthLoading(false);
      }
    } catch (error: unknown) {
      console.error("Error in OTP login flow:", error);
      const errorMessage =
        t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.";
      showToastMessage(errorMessage, "error");
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = () => {
    localStorage.setItem("redirectionRoute", "/");
    router.push("/password-forget");
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box
        key={language}
        sx={{
          position: "relative",
          height: { xs: "70vh", lg: "100vh" },
          minHeight: { xs: "auto", lg: "auto" },
          overflow: { xs: "visible", lg: "hidden" },
          overflowX: "hidden", // Prevent horizontal scroll
          width: "100%",
          maxWidth: "100vw", // Ensure it doesn't exceed viewport
        }}
      >
        {/* Header with logo + tenant name + language selector (config-based) */}
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
            zIndex: 20,
            backgroundColor: alpha(backgroundColor, 0.9),
            backdropFilter: "blur(6px)",
            borderBottom: `1px solid ${alpha(uiSecondaryColor, 0.08)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.25 } }}>
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${alpha(uiPrimaryColor, 0.3)}`,
                boxShadow: `0 4px 8px ${uiPrimaryColor}22`,
                overflow: "hidden",
              }}
            >
              {tenantIcon.startsWith("data:") ? (
                <img src={tenantIcon} alt={`${tenantName} logo`} width={50} height={50} style={{ objectFit: "contain" }} />
              ) : (
                <Image src={tenantIcon} alt={`${tenantName} logo`} width={20} height={20} style={{ objectFit: "contain" }} />
              )}
            </Box>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                color: uiSecondaryColor,
                display: { xs: "none", sm: "block" },
              }}
            >
              {tenantName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LanguageDropdown
              primaryColor={uiPrimaryColor}
              secondaryColor={uiSecondaryColor}
              size="small"
              minWidth={150}
            />
          </Box>
        </Box>

        <FloatingIconsOverlay primaryColor={uiPrimaryColor} />
        <ConcentricRingsBackground
          primaryColor={uiPrimaryColor}
          secondaryColor={uiSecondaryColor}
          backgroundColor={backgroundColor}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            // HEADER OFFSET — MOBILE ONLY
            pt: { xs: "72px", sm: "80px", lg: 0 },
            // TOP MARGIN — RESTORED FOR WEB
            mt: { xs: 0, sm: 10 },
            mb: { xs: 2, sm: 2, lg: 0 },
            // HEIGHT — NO FORCED HEIGHT ON MOBILE, KEEP WEB
            height: { xs: "auto", lg: "calc(100vh - 80px)" },
            minHeight: { xs: "auto", lg: "auto" },
            pb: { xs: 2, sm: 2, lg: 0 },
            width: "100%",
            maxWidth: "100vw", // Prevent horizontal overflow
            boxSizing: "border-box",
            overflowX: "hidden", // Prevent horizontal scroll
          }}
        >
          <HomeLeftColumn
            features={features}
            description={headingDescription}
            tagline={tagline}
            uiSecondaryColor={uiSecondaryColor}
            t={t}
          />

          <HomeRightColumn
            entryMode={entryMode}
            setEntryMode={setEntryMode}
            tenantIcon={tenantIcon}
            uiPrimaryColor={uiPrimaryColor}
            uiSecondaryColor={uiSecondaryColor}
            t={t}
            onLogin={handleLogin}
            onVerifyOtp={handleVerifyOtp}
            handleForgotPassword={handleForgotPassword}
            isLoading={isAuthLoading}
          />
        </Box>
      </Box>
    </Layout>
  );
}
