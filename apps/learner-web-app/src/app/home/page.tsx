"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @nx/enforce-module-boundaries */

import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import React, { Suspense, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Layout, useTranslation } from "@shared-lib";
import { useTenant } from "@learner/context/TenantContext";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import { getLocalizedText } from "@learner/utils/API/TenantService";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { getUserId, login } from "@learner/utils/API/LoginService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";
import { sendOTP, verifyOTP } from "@learner/utils/API/OtPService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";
import { logEvent } from "@learner/utils/googleAnalytics";
import {
  ensureAcademicYearForTenant,
} from "@learner/utils/API/ProgramService";

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

// Login Component Interface
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
  onBack?: () => void;
}

// Login Component
const LoginComponent: React.FC<LoginComponentProps> = ({
  onLogin,
  onVerifyOtp,
  handleAddAccount,
  handleForgotPassword,
  prefilledUsername,
  onRedirectToLogin,
  onBack,
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

  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forcePasswordMode, setForcePasswordMode] = useState(!isOtpLoginMethod);
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
  
  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isMobileNumber = (username: string) => {
    return /^\d{10,}$/.test(username);
  };

  const processMobileNumber = (mobile: string): string => {
    if (mobile.length === 12 && mobile.startsWith("91")) {
      return mobile.substring(2);
    }
    return mobile;
  };

  const isOtpMode = isOtpLoginMethod && otpSent && !forcePasswordMode;

  const sendOtp = useCallback(
    async (mobile: string) => {
      const now = Date.now();
      if (isSendingOtp || hasCheckedUser || now - lastCallTime < 1000) {
        return;
      }

      setLastCallTime(now);
      setIsSendingOtp(true);
      setHasCheckedUser(true);
      try {
        const processedMobile = processMobileNumber(mobile);
        const userCheckResponse = await checkUserExistenceWithTenant(processedMobile);

        if (
          userCheckResponse?.params?.status === "failed" ||
          userCheckResponse?.responseCode === 404 ||
          userCheckResponse?.responseCode !== 200
        ) {
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          return;
        }

        const users = userCheckResponse?.result?.getUserDetails || [];
        const domainTenantId = tenant?.tenantId;
        
        if (!domainTenantId) {
          showToastMessage(
            "Tenant configuration not found. Please contact administrator.",
            "error"
          );
          return;
        }

        if (!users || users.length === 0) {
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          return;
        }

        const userWithTargetTenant = users.find(
          (user: { tenantId: string }) => user.tenantId === domainTenantId
        );

        if (userWithTargetTenant) {
          const response = await sendOTP({
            mobile: processedMobile,
            reason: "login",
          });

          if (response?.result?.data?.hash) {
            setOtpHash(response.result.data.hash);
          }
          setOtpSent(true);
          setResendTimer(120);
          setFormData((prev) => ({
            ...prev,
            username: processedMobile,
          }));
        } else {
          showToastMessage(
            "This user is not registered for this tenant. Please contact your administrator.",
            "error"
          );
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          setHasCheckedUser(false);
        }
      } catch (error: unknown) {
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
          errorResponse?.response?.data?.params?.errmsg === "User does not exist"
        ) {
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          return;
        }
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
      try {
        const verifyResponse = await verifyOTP({
          mobile: formData.username,
          reason: "login",
          otp: formData.otp,
          hash: otpHash,
        });

        if (
          verifyResponse?.responseCode === 200 ||
          verifyResponse?.params?.status === "successful"
        ) {
          onVerifyOtp({
            username: formData.username,
            otp: formData.otp,
            remember: formData.remember,
            hash: otpHash,
          });
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
      }
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

  // Password login method
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
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{
              mb: { xs: 1.5, sm: 2 },
              color: secondaryColor,
              "&:hover": {
                backgroundColor: `${primaryColor}15`,
              },
            }}
          >
            <ArrowBack />
          </IconButton>
        )}
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
            backgroundColor: alpha(primaryColor, 0.7),
            color: `${buttonTextColor} !important`,
            fontSize: { xs: "14px", sm: "16px" },
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: alpha(primaryColor, 0.15),
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

  // OTP Login Method
  return (
    <Box
      sx={{
        maxWidth: { xs: "100%", sm: 500 },
        width: "100%",
        mx: "auto",
        px: { xs: 1, sm: 0 },
      }}
    >
      {onBack && !isOtpMode && (
        <IconButton
          onClick={onBack}
          sx={{
            mb: { xs: 1.5, sm: 2 },
            color: secondaryColor,
            "&:hover": {
              backgroundColor: `${primaryColor}15`,
            },
          }}
        >
          <ArrowBack />
        </IconButton>
      )}
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
        <>
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
        </>
      ) : (
        <>
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
              "&:disabled": {
                backgroundColor: backgroundColor,
                color: secondaryColor,
                opacity: 0.5,
              },
            }}
          >
            {t("LEARNER_APP.LOGIN.ENTER_OTP") || "ENTER OTP"}
          </Button>

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
        </>
      )}
    </Box>
  );
};

// Moving Books Animation Component
const ConcentricRingsBackground = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) => {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(circle at 88% 24%, ${alpha(secondaryColor, 0.12)} 0, transparent 48%),
          radial-gradient(circle at 18% 78%, ${alpha(primaryColor, 0.08)} 0, transparent 46%),
          repeating-radial-gradient(circle at 78% 32%, ${alpha(
            secondaryColor,
            0.10
          )} 0, ${alpha(secondaryColor, 0.10)} 2px, transparent 2px, transparent 26px),
          repeating-radial-gradient(circle at 20% 42%, ${alpha(
            primaryColor,
            0.08
          )} 0, ${alpha(primaryColor, 0.08)} 2px, transparent 2px, transparent 28px)
        `,
        opacity: 0.32,
        pointerEvents: "none",
        zIndex: 0,
        animation: "ringDrift 26s linear infinite",
        "@keyframes ringDrift": {
          "0%": { transform: "scale(1) translateY(0px)" },
          "50%": { transform: "scale(1.02) translateY(6px)" },
          "100%": { transform: "scale(1) translateY(0px)" },
        },
      }}
    />
  );
};

const FloatingIconsOverlay = ({
  primaryColor,
}: {
  primaryColor: string;
}) => {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {/* Small book top-left */}
      {/* <Box
        sx={{
          position: "absolute",
          top: "14%",
          left: "9%",
          fontSize: { xs: "1.4rem", sm: "1.6rem" },
          opacity: 0.16,
          animation: "floatBookTL 12s ease-in-out infinite",
          "@keyframes floatBookTL": {
            "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
            "50%": { transform: "translateY(-14px) translateX(10px) rotate(8deg)" },
          },
        }}
      >
        📚
      </Box> */}

      {/* Star near header center */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "45%",
          fontSize: { xs: "1.2rem", sm: "1.4rem" },
          opacity: 0.2,
          color: primaryColor,
          animation: "floatStarHeader 11s ease-in-out infinite",
          animationDelay: "0.8s",
          "@keyframes floatStarHeader": {
            "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
            "50%": { transform: "translateY(-12px) translateX(6px) rotate(10deg)" },
          },
        }}
      >
        ✨
      </Box>

      {/* Graduation cap right side */}
      <Box
        sx={{
          position: "absolute",
          top: "18%",
          right: "6%",
          fontSize: { xs: "1.3rem", sm: "1.5rem" },
          opacity: 0.18,
          animation: "floatCapHeader 13s ease-in-out infinite",
          animationDelay: "0.6s",
          "@keyframes floatCapHeader": {
            "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
            "50%": { transform: "translateY(14px) translateX(-8px) rotate(-8deg)" },
          },
        }}
      >
        🎓
      </Box>
    </Box>
  );
};

const MovingBooksAnimation = ({ primaryColor }: { primaryColor: string }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Book at top */}
      {/* <Box
        sx={{
          position: "absolute",
          fontSize: { xs: "1.6rem", sm: "1.9rem", md: "2.2rem" },
          opacity: 0.16,
          top: "10%",
          left: "15%",
          animation: "floatTop 12s ease-in-out infinite",
          "@keyframes floatTop": {
            "0%, 100%": { 
              transform: "translateY(0) translateX(0) rotate(0deg)", 
              opacity: 0.16 
            },
            "50%": { 
              transform: "translateY(22px) translateX(30px) rotate(12deg)", 
              opacity: 0.2 
            },
          },
          zIndex: 2,
        }}
      >
        📚
      </Box> */}
      
      {/* Book at bottom */}
      <Box
        sx={{
          position: "absolute",
          fontSize: { xs: "1.7rem", sm: "2rem", md: "2.3rem" },
          opacity: 0.16,
          bottom: "16%",
          right: "18%",
          animation: "floatBottom 14s ease-in-out infinite",
          animationDelay: "1.2s",
          "@keyframes floatBottom": {
            "0%, 100%": { 
              transform: "translateY(0) translateX(0) rotate(0deg)", 
              opacity: 0.16 
            },
            "50%": { 
              transform: "translateY(-22px) translateX(-30px) rotate(-12deg)", 
              opacity: 0.2 
            },
          },
          zIndex: 2,
        }}
      >
        📖
      </Box>

      {/* Star spark */}
      <Box
        sx={{
          position: "absolute",
          fontSize: { xs: "1.3rem", sm: "1.5rem", md: "1.7rem" },
          opacity: 0.22,
          top: "30%",
          left: "8%",
          animation: "floatStar 11s ease-in-out infinite",
          "@keyframes floatStar": {
            "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: 0.22 },
            "50%": { transform: "translateY(-14px) rotate(10deg)", opacity: 0.26 },
          },
          zIndex: 2,
        }}
      >
        ✨
      </Box>

      {/* Graduation cap */}
      <Box
        sx={{
          position: "absolute",
          fontSize: { xs: "1.4rem", sm: "1.6rem", md: "1.8rem" },
          opacity: 0.18,
          bottom: "10%",
          left: "46%",
          animation: "floatCap 13s ease-in-out infinite",
          animationDelay: "0.8s",
          "@keyframes floatCap": {
            "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: 0.18 },
            "50%": { transform: "translateY(-16px) translateX(10px) rotate(8deg)", opacity: 0.22 },
          },
          zIndex: 2,
        }}
      >
        🎓
      </Box>

    </Box>
  );
};

export default function Index() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { tenant, contentFilter, isLoading: tenantLoading } = useTenant();
  const programCarouselRef = useRef<HTMLDivElement>(null);
  
  // Login state management
  const [prefilledUsername, setPrefilledUsername] = useState<string>("");
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [entryMode, setEntryMode] = useState<"selection" | "learner">("selection");

  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#FFFFFF";
  
  // Get localized tenant name
  const tenantNameRaw = contentFilter?.title || tenant?.name || "Learner";
  const tenantName = typeof tenantNameRaw === "string" ? tenantNameRaw : getLocalizedText(tenantNameRaw, language, "Learner");
  
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantAlt = `${tenantName} logo`;
  
  // Get localized descriptions and taglines
  const description = getLocalizedText(
    contentFilter?.description || contentFilter?.homePageContent?.description,
    language,
    ""
  );
  const tagline = getLocalizedText(
    contentFilter?.tagline || contentFilter?.homePageContent?.tagline,
    language,
    ""
  );
  
  // Get localized button texts
  const chooseLanguageText = getLocalizedText(
    contentFilter?.homePageContent?.chooseLanguageText,
    language,
    t("LEARNER_APP.HOME.CHOOSE_LANGUAGE") || "Choose your language"
  );
  const continueButtonText = getLocalizedText(
    contentFilter?.homePageContent?.continueButtonText,
    language,
    t("LEARNER_APP.HOME.CONTINUE") || "Continue to Login"
  );
  const getStartedButtonText = getLocalizedText(
    contentFilter?.homePageContent?.getStartedButtonText,
    language,
    t("LEARNER_APP.HOME.LOGIN_LINK") || "Get Started"
  );
  
  const isSwadhaarTenant = tenantName.toLowerCase().includes("swadhaar");
  const uiPrimaryColor = primaryColor;
  const uiSecondaryColor = secondaryColor;
  const subtleTextColor = alpha(uiSecondaryColor, 0.65);
  const mutedTextColor = alpha(uiSecondaryColor, 0.55);
  
  // Create harmonious color combinations
  const primaryLight = alpha(uiPrimaryColor, 0.1);
  const primaryMedium = alpha(uiPrimaryColor, 0.2);
  const primaryDark = alpha(uiPrimaryColor, 0.8);
  const secondaryLight = alpha(uiSecondaryColor, 0.1);
  const secondaryMedium = alpha(uiSecondaryColor, 0.2);
  const gradientPrimary = `linear-gradient(135deg, ${uiPrimaryColor} 0%, ${primaryDark} 100%)`;
  const gradientSecondary = `linear-gradient(135deg, ${uiSecondaryColor} 0%, ${alpha(uiSecondaryColor, 0.8)} 100%)`;

  const features = useMemo(
    () => {
      // Only use tenant configuration - no fallback
      if (contentFilter?.ourSolutions && contentFilter.ourSolutions.length > 0) {
        return contentFilter.ourSolutions.map((solution) => ({
          icon: solution.icon,
          title: getLocalizedText(
            solution.title,
            language,
            typeof solution.title === "string" ? solution.title : ""
          ),
          description: getLocalizedText(
            solution.description,
            language,
            typeof solution.description === "string" ? solution.description : ""
          ),
        }));
      }
      
      // Return empty array if no solutions in config
      return [];
    },
    [contentFilter, language]
  );

  const swadhaarHighlights = useMemo(
    () => {
      // Use tenant configuration if available
      if (contentFilter?.homePageContent?.highlights && contentFilter.homePageContent.highlights.length > 0) {
        return contentFilter.homePageContent.highlights.map((highlight) => ({
          title: getLocalizedText(
            highlight.title,
            language,
            typeof highlight.title === "string" ? highlight.title : ""
          ),
          description: getLocalizedText(
            highlight.description,
            language,
            typeof highlight.description === "string" ? highlight.description : ""
          ),
        }));
      }
      
      // Fallback to default highlights
      return [
        {
          title: t("LEARNER_APP.HOME.HIGHLIGHTS.BILINGUAL_TITLE") || "Bilingual content",
          description:
            t("LEARNER_APP.HOME.HIGHLIGHTS.BILINGUAL_DESC") ||
            "Switch between English & Hindi any time",
        },
        {
          title: t("LEARNER_APP.HOME.HIGHLIGHTS.CERTIFIED_TITLE") || "Certified programs",
          description:
            t("LEARNER_APP.HOME.HIGHLIGHTS.CERTIFIED_DESC") ||
            "Earn shareable certificates on completion",
        },
        {
          title: t("LEARNER_APP.HOME.HIGHLIGHTS.SELF_PACED_TITLE") || "Self paced",
          description:
            t("LEARNER_APP.HOME.HIGHLIGHTS.SELF_PACED_DESC") ||
            "Learn at a speed that suits your routine",
        },
      ];
    },
    [t, contentFilter, language]
  );

  const renderLoadingState = (bg: string) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: bg,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress sx={{ color: uiPrimaryColor }} />
        <Typography sx={{ mt: 2, color: uiSecondaryColor }}>
          {t("LEARNER_APP.COMMON.LOADING") || "Loading..."}
        </Typography>
      </Box>
    </Box>
  );

  const handleLanguageSelect = (lang: string) => {
    if (isSwadhaarTenant) {
      setLanguage(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("lang", lang);
      }
    }
    router.push("/login");
  };

  const handleAddAccount = () => {
    router.push("/");
  };

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

        if (userRole === "Learner" || userRole === "Teacher") {
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

          window.location.href = `${window.location.origin.replace("3003", "3002")}/login`;
          return;
        } else {
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

  const handleForgotPassword = () => {
    localStorage.setItem("redirectionRoute", "/");
    router.push("/password-forget");
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
      }
    } catch (error: unknown) {
      console.error("Error in OTP login flow:", error);
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

  // Authentication check effect
  useEffect(() => {
    const init = async () => {
      try {
        preserveLocalStorage();

        const localStorageToken = localStorage.getItem("token");
        const cookieToken = getCookieValue("token");
        const access_token = localStorageToken || cookieToken;
        const refresh_token = localStorage.getItem("refreshToken");

        if (access_token) {
          const userId = localStorage.getItem("userId");
          const tenantId = localStorage.getItem("tenantId");
          
          if (userId && tenantId) {
            if (typeof window !== "undefined") {
              const searchParams = new URLSearchParams(window.location.search);
              const redirectUrl = searchParams.get("redirectUrl");
              const activeLink = searchParams.get("activeLink");

              if (redirectUrl && redirectUrl.startsWith("/")) {
                window.location.href = `${window.location.origin}${redirectUrl}${
                  activeLink ? `?activeLink=${activeLink}` : ""
                }`;
                return;
              }
            }

            window.location.href = `${window.location.origin}/dashboard?tab=1`;
            return;
          } else {
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
        }

        setShowLoginForm(true);
      } catch (error) {
        console.error("Error in authentication check:", error);
        setShowLoginForm(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    init();
  }, [router]);

  if (tenantLoading) {
    return renderLoadingState(backgroundColor);
  }

  const SwadhaarLanguageButtons = ({ variant }: { variant: "header" | "body" }) => {
    const languages = [
      { code: "en", label: "ENGLISH" },
      { code: "hi", label: "हिन्दी" },
    ];

    if (variant === "header") {
    return (
      <Box 
        sx={{ 
          display: "flex", 
            gap: 1,
            alignItems: "center",
        }}
      >
        {languages.map((lang) => (
          <Button
            key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                if (typeof window !== "undefined") {
                  localStorage.setItem("lang", lang.code);
                }
              }}
            sx={{
                px: 2,
                py: 0.75,
                backgroundColor: language === lang.code ? uiPrimaryColor : "transparent",
                color: language === lang.code ? "#FFFFFF" : uiSecondaryColor,
                fontSize: { xs: "12px", sm: "14px" },
                fontWeight: 500,
              textTransform: "none",
              borderRadius: "4px",
                minWidth: "auto",
                border: language === lang.code ? "none" : `1px solid ${alpha(uiSecondaryColor, 0.2)}`,
              "&:hover": {
                  backgroundColor: language === lang.code ? uiPrimaryColor : alpha(uiPrimaryColor, 0.1),
              },
            }}
          >
            {lang.label}
          </Button>
        ))}
      </Box>
    );
    }

    return null; // Language selector now only in header
  };
  console.log(buttonTextColor);

  const renderSwadhaarHome = () => (
    <Layout onlyHideElements={["footer", "topBar"]} _topAppBar={undefined}>
      {/* Fixed Header */}
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
          backgroundColor: "white",
          borderBottom: `1px solid ${alpha(uiSecondaryColor, 0.1)}`,
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
            {tenantIcon.startsWith("data:") ? (
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
              fontWeight: 400,
              marginLeft: { xs: 1, sm: 2 },
              fontSize: { xs: "16px", sm: "20px" },
              lineHeight: "28px",
              color: uiSecondaryColor,
            }}
          >
            {tenantName}
          </Typography>
        </Box>
        
        {/* Language Selector in Header */}
        <SwadhaarLanguageButtons variant="header" />
      </Box>

      <Suspense fallback={renderLoadingState(backgroundColor)}>
        <Box key={language} display="flex" flexDirection="column" sx={{ wordBreak: "break-word", position: "relative", overflow: "hidden" }}>
          <ConcentricRingsBackground
            primaryColor={uiPrimaryColor}
            secondaryColor={uiSecondaryColor}
          />
          <FloatingIconsOverlay primaryColor={uiPrimaryColor} />
          {/* Two Column Layout: Content (Left) + Login/Logo (Right) */}
          <Box
            sx={{
            position: "relative",
              minHeight: "100vh",
              display: "flex",
            flexDirection: { xs: "column", lg: "row" },
              pt: { xs: 8, sm: 10 },
            backgroundColor: backgroundColor,
            overflow: "hidden",
            }}
          >
            {/* Left Column - Content */}
            <Box
              sx={{
                flex: { xs: "none", lg: features.length > 0 ? 1 : "none" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 4, md: 6 },
                overflowY: "visible",
                maxHeight: "none",
                position: "relative",
                zIndex: 1,
                width: features.length === 0 ? { xs: "100%", lg: "50%" } : "auto",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
              }}
            >
              <MovingBooksAnimation primaryColor={uiPrimaryColor} />
              
              <Box 
                sx={{ 
                  mb: { xs: 4, md: 5 }, 
                  position: "relative", 
                  zIndex: 1,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                   {/* Description (using tagline UI style) */}
                   {description && description.trim() !== "" && (
              <Typography
                    variant="h6"
                sx={{
                      fontWeight: 600,
                      color: uiPrimaryColor,
                      mb: 1,
                      fontSize: { xs: "1.5rem", sm: "2rem", md: "2rem" },
                      lineHeight: 1.2,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {description}
              </Typography>
                )}
                {/* Tagline - Only show if exists in config (using description UI style) */}
                {tagline && tagline.trim() !== "" && (
              <Typography
                    variant="body1"
                sx={{
                  fontWeight: 400,
              color: "#000000",
                      mb: 3,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      lineHeight: 1.7,
                      maxWidth: "100%",
                    }}
                  >
                    {tagline}
              </Typography>
                )}
                
                {/* Our Solutions Section - Only show if solutions exist in config */}
                {features.length > 0 && (
                  <>
                    {(contentFilter?.ourSolutionsTitle || contentFilter?.homePageContent?.ourSolutionsTitle) && (
              <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: uiPrimaryColor,
                          mb: 1.5,
                          fontSize: { xs: "1.3rem", sm: "1.5rem", md: "1.7rem" },
                          mt: 4,
                        }}
                      >
                        {getLocalizedText(
                          contentFilter?.ourSolutionsTitle || contentFilter?.homePageContent?.ourSolutionsTitle,
                          language,
                          ""
                        )}
                      </Typography>
                    )}
                    {(contentFilter?.ourSolutionsDescription || contentFilter?.homePageContent?.ourSolutionsDescription) && (
                      <Typography
                        variant="body2"
                sx={{
                  fontWeight: 400,
                          color: "#000000",
                          maxWidth: "500px",
                          fontSize: { xs: "0.85rem", sm: "0.95rem" },
                          lineHeight: 1.6,
                          mb: 3,
                        }}
                      >
                        {getLocalizedText(
                          contentFilter?.ourSolutionsDescription || contentFilter?.homePageContent?.ourSolutionsDescription,
                          language,
                          ""
                        )}
              </Typography>
                    )}
                  </>
                )}
              </Box>

              {features.length > 0 && (
                <Grid 
                  container 
                  spacing={2}
                  justifyContent="flex-start"
                  sx={{ position: "relative", zIndex: 1 }}
                >
                  {features.map((feature) => (
                  <Grid 
                    item 
                    xs={6} 
                    sm={4} 
                    md={3}
                    key={feature.title}
                  >
                    <Card
                sx={{
                        height: "100%",
                        textAlign: "left",
                        border: "none",
                        boxShadow: "none",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                  display: "flex",
                          gap: 1.5,
                          alignItems: "flex-start",
                }}
              >
                <Box
                  sx={{
                            width: 44,
                            minHeight: 44,
                            borderRadius: "10px",
                            backgroundColor: alpha(uiPrimaryColor, 0.1),
                            border: `1px solid ${alpha(uiPrimaryColor, 0.2)}`,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "center",
                            paddingTop: "10px",
                            fontSize: "1.8rem",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {!feature.icon.startsWith("data:") &&
                          !feature.icon.startsWith("http://") &&
                          !feature.icon.startsWith("https://") &&
                          !feature.icon.startsWith("/") ? (
                            <>{feature.icon}</>
                          ) : (
                            <Image
                              src={feature.icon}
                              alt={feature.title}
                              width={44}
                              height={44}
                              style={{ objectFit: "cover" }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                  sx={{
                              fontWeight: 700,
                              color: uiPrimaryColor,
                              fontSize: { xs: "0.9rem", sm: "1rem" },
                            }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                  sx={{
                              color: "#000000",
                              lineHeight: 1.5,
                              fontSize: { xs: "0.8rem", sm: "0.9rem" },
                              textAlign: "left",
                            }}
                          >
                            {feature.description}
                          </Typography>
              </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                </Grid>
              )}
            </Box>

            {/* Right Column - Login Functionality or Logo Box */}
            <Box
              sx={{
                flex: { xs: "none", lg: features.length > 0 ? 1 : "none" },
                display: "flex",
                flexDirection: "column",
                justifyContent: { xs: "flex-start", lg: "center" },
                alignItems: features.length === 0 ? "center" : "flex-start",
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 2, sm: 4 },
                backgroundColor: backgroundColor,
                borderLeft: { xs: "none", lg: `1px solid ${alpha(uiSecondaryColor, 0.1)}` },
                borderTop: { xs: `1px solid ${alpha(uiSecondaryColor, 0.1)}`, lg: "none" },
                overflowY: "visible",
                maxHeight: "none",
                width: features.length === 0 ? { xs: "100%", lg: "50%" } : "auto",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
              }}
            >
              {/* Always show Login - styled as a modern login card */}
              {isCheckingAuth ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                sx={{
                    minHeight: "400px",
                  width: "100%",
                  }}
                >
                  <CircularProgress sx={{ color: uiPrimaryColor }} />
                </Box>
              ) : showLoginForm ? (
                <Card
                  sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", sm: "480px", md: "520px" },
                    mx: "auto",
                    borderRadius: 4,
                    boxShadow: `0 8px 32px ${alpha(uiSecondaryColor, 0.15)}`,
                    border: `1px solid ${secondaryLight}`,
                backgroundColor: "#ffffff",
                    overflow: "hidden",
                background: "#ffffff",
                minHeight: 520,
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    {entryMode === "selection" ? (
                      <>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {tenantIcon ? (
                        tenantIcon.startsWith("data:") ? (
                          <img src={tenantIcon} alt={tenantAlt} width={60} height={60} style={{ objectFit: "contain" }} />
                        ) : (
                          <Image src={tenantIcon} alt={tenantAlt} width={60} height={60} style={{ objectFit: "contain" }} />
                        )
                      ) : null}
                    </Box>
                    {/* Sign In Heading */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: uiPrimaryColor,
                          fontSize: { xs: "1.5rem", sm: "1.8rem" },
                        }}
                      >
                        {t("LEARNER_APP.LOGIN.LOGIN") || "Login"}
                      </Typography>
                    </Box>
                        
                        {/* Description */}
                        <Typography
                      variant="body1"
                          sx={{
                            color: "#000000",
                        mb: 3,
                        lineHeight: 1.6,
                        fontSize: { xs: "0.95rem", sm: "1.05rem" },
                          }}
                        >
                          {t("LEARNER_APP.LOGIN.LEARNER_OR_WORKSPACE") ||
                            "Login as a learner or go to the workspace portal."}
                        </Typography>
                        
                        {/* Action Buttons */}
                <Box
                  sx={{
                    display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setEntryMode("learner")}
                            sx={{
                              backgroundColor: alpha(uiPrimaryColor, 0.7),
                              color: "#ffffff",
                              fontWeight: 600,
                              py: 1.5,
                              borderRadius: 2,
                              boxShadow: `0 4px 12px ${alpha(uiSecondaryColor, 0.3)}`,
                              textTransform: "none",
                              fontSize: "1rem",
                              "&:hover": { 
                                backgroundColor: alpha(uiPrimaryColor, 0.8),
                                boxShadow: `0 6px 20px ${alpha(uiSecondaryColor, 0.4)}`,
                                transform: "translateY(-1px)",
                              },
                              transition: "all 0.2s ease",
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
                              borderColor: alpha(uiPrimaryColor, 0.5),
                              borderWidth: 2,
                              color: "#ffffff",
                              fontWeight: 600,
                              py: 1.5,
                              borderRadius: 2,
                              textTransform: "none",
                              fontSize: "1rem",
                              backgroundColor: alpha(uiPrimaryColor, 0.1),
                              "&:hover": {
                                borderColor: alpha(uiSecondaryColor, 0.7),
                                backgroundColor: alpha(uiSecondaryColor, 0.15),
                                color: uiSecondaryColor,
                                borderWidth: 2,
                              },
                              transition: "all 0.2s ease",
                            }}
                          >
                            {t("LEARNER_APP.LOGIN.GO_TO_WORKSPACE") || "Go to Workspace"}
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <>
                      
                        
                   
                        
                        {/* Login Component */}
                        <LoginComponent
                          onLogin={handleLogin}
                          onVerifyOtp={handleVerifyOtp}
                          handleForgotPassword={handleForgotPassword}
                          handleAddAccount={handleAddAccount}
                          prefilledUsername={prefilledUsername}
                          onBack={() => setEntryMode("selection")}
                          onRedirectToLogin={() => {
                            showToastMessage(
                              "User not registered. Please contact your administrator to register your account.",
                              "error"
                            );
                          }}
                        />
                        
                        {/* Go to Workspace Link */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            mt: 3,
                            pt: 3,
                            borderTop: `1px solid ${secondaryLight}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#000000",
                              fontSize: "0.875rem",
                            }}
                          >
                            Need workspace access?{" "}
                            <Typography
                              component="span"
                              sx={{
                                color: uiPrimaryColor,
                                fontWeight: 600,
                                cursor: "pointer",
                                "&:hover": { 
                                  textDecoration: "underline",
                                  color: primaryDark,
                                },
                                transition: "color 0.2s ease",
                              }}
                              onClick={() => {
                                window.location.href = "https://admin.sunbirdsaas.com/login";
                              }}
                            >
                              Go to Workspace
                            </Typography>
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Suspense>
    </Layout>
  );

  const renderDefaultHome = () => (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Suspense
        fallback={renderLoadingState("linear-gradient(135deg, #FFFDF7 0%, #F8EFDA 100%)")}
      >
        <Box
          key={language}
          display="flex"
          flexDirection="column"
          sx={{ wordBreak: "break-word", position: "relative", overflow: "hidden" }}
        >
          <ConcentricRingsBackground
            primaryColor={uiPrimaryColor}
            secondaryColor={uiSecondaryColor}
          />
          <FloatingIconsOverlay primaryColor={uiPrimaryColor} />
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
              backgroundColor: alpha(backgroundColor, 0.82),
              backdropFilter: "blur(4px)",
              borderBottom: `1px solid ${alpha(uiSecondaryColor, 0.08)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
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
                  <img
                    src={tenantIcon}
                    alt={tenantAlt}
                    width={40}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <Image
                    src={tenantIcon}
                    alt={tenantAlt}
                    width={40}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1rem", sm: "1.2rem" },
                  color: uiSecondaryColor,
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
                primaryColor={uiPrimaryColor}
                secondaryColor={uiSecondaryColor}
                size="small"
                minWidth={150}
              />
            </Box>
          </Box>

          {/* Two Column Layout: Our Solutions (Left) + Login (Right) */}
          <Box
            sx={{
              position: "relative",
              minHeight: "100vh",
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              pt: { xs: 8, sm: 10 },
              backgroundColor: backgroundColor,
              overflow: "hidden",
            }}
          >
            <ConcentricRingsBackground
              primaryColor={uiPrimaryColor}
              secondaryColor={uiSecondaryColor}
            />
            {/* Left Column - Our Solutions (No Scroll) */}
                  <Box
                    sx={{
                flex: { xs: "none", lg: 1 },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 4, md: 6 },
                overflowY: "visible",
                maxHeight: "none",
                      position: "relative",
                      zIndex: 1,
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
              }}
            >
              <MovingBooksAnimation primaryColor={uiPrimaryColor} />
              
              <Box 
                sx={{ 
                  mb: { xs: 4, md: 5 }, 
                  position: "relative", 
                  zIndex: 1,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                   {/* Description (using tagline UI style) */}
                   {description && description.trim() !== "" && (
                    <Typography
                    variant="h6"
                      sx={{
                      fontWeight: 800,
                      color: uiPrimaryColor,
                      mb: 1,
                      fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                      lineHeight: 1.2,
                      letterSpacing: "-0.02em",
                      }}
                    >
                    {description}
                    </Typography>
                )}
                {/* Tagline - Only show if exists in config (using description UI style) */}
                {tagline && tagline.trim() !== "" && (
                    <Typography
                    variant="body1"
                      sx={{
                        fontWeight: 400,
              color: "#000000",
                      mb: 3,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      lineHeight: 1.7,
                      maxWidth: "100%",
                    }}
                  >
                    {tagline}
                    </Typography>
                )}
                
                {/* Our Solutions Section - Only show if solutions exist in config */}
                {features.length > 0 && (
                  <>
                    {(contentFilter?.ourSolutionsTitle || contentFilter?.homePageContent?.ourSolutionsTitle) && (
                <Typography
                        variant="h5"
                  sx={{
                          fontWeight: 700,
                    color: uiPrimaryColor,
                    mb: 1.5,
                          fontSize: { xs: "1.3rem", sm: "1.5rem", md: "1.7rem" },
                          mt: 4,
                  }}
                >
                  {getLocalizedText(
                    contentFilter?.ourSolutionsTitle || contentFilter?.homePageContent?.ourSolutionsTitle,
                    language,
                          ""
                  )}
                </Typography>
                    )}
                    {(contentFilter?.ourSolutionsDescription || contentFilter?.homePageContent?.ourSolutionsDescription) && (
                <Typography
                        variant="body2"
                  sx={{
                    fontWeight: 400,
                    color: "#000000",
                    maxWidth: "500px",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                    lineHeight: 1.6,
                          mb: 3,
                  }}
                >
                  {getLocalizedText(
                    contentFilter?.ourSolutionsDescription || contentFilter?.homePageContent?.ourSolutionsDescription,
                    language,
                          ""
                  )}
                </Typography>
                    )}
                  </>
                )}
              </Box>

              {features.length > 0 && (
              <Grid 
                container 
    spacing={2}
                justifyContent="flex-start"
    sx={{ position: "relative", zIndex: 1 }}
              >
                {features.map((feature) => (
                  <Grid 
                    item 
        xs={6} 
        sm={4} 
        md={3}
                    key={feature.title}
                  >
                    <Card
                      sx={{
                        height: "100%",
            textAlign: "left",
            boxShadow: `0 2px 8px ${primaryLight}`,
            borderRadius: "12px",
                        transition: "all 0.3s ease",
            backgroundColor: "#ffffff",
                        "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: `0 6px 20px ${alpha(uiPrimaryColor, 0.3)}`,
              borderColor: uiPrimaryColor,
              backgroundColor: primaryLight,
                        },
                      }}
                    >
          <CardContent
                          sx={{
              p: { xs: 1.5, sm: 2 },
            }}
          >
            {/* First row: Image and Title side by side */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "flex-start",
              gap: 1.5,
              mb: 1,
            }}>
                            <Box
                              sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  backgroundColor: alpha(uiPrimaryColor, 0.1),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                  fontSize: "1.8rem",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {!feature.icon.startsWith("data:") && 
                 !feature.icon.startsWith("http://") && 
                 !feature.icon.startsWith("https://") && 
                 !feature.icon.startsWith("/") ? (
                  <>{feature.icon}</>
                              ) : (
                                <Image
                                  src={feature.icon}
                                  alt={feature.title}
                    width={44}
                    height={44}
                    style={{ objectFit: "cover" }}
                  />
                          )}
                        </Box>
                        <Typography
                variant="subtitle2"
                          sx={{
                  fontWeight: 700,
                            color: uiSecondaryColor,
                  fontSize: { xs: "0.9rem", sm: "0.9rem" },
                  flex: 1,
                  pt: 0.5,
                          }}
                        >
                          {feature.title}
                        </Typography>
            </Box>
            
            {/* Second row: Description - starts from left edge */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#000000",
                            lineHeight: 1.5,
                fontSize: { xs: "0.8rem", sm: "0.8rem" },
                textAlign: "left",
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>

                    </Card>
                  </Grid>
                ))}
              </Grid>
              )}
            </Box>

            {/* Right Column - Login Functionality */}
            <Box
              sx={{
                flex: { xs: "none", lg: 1 },
                display: "flex",
                flexDirection: "column",
                justifyContent: { xs: "flex-start", lg: "center" },
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 2, sm: 4 },
                backgroundColor: backgroundColor,
                borderLeft: { xs: "none", lg: `1px solid ${alpha(uiSecondaryColor, 0.1)}` },
                borderTop: { xs: `1px solid ${alpha(uiSecondaryColor, 0.1)}`, lg: "none" },
                overflowY: "auto",
                maxHeight: { xs: "none", lg: "100vh" },
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
              }}
            >
          {isCheckingAuth ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    minHeight: "400px",
                position: "relative",
                zIndex: 1,
                  }}
                >
                  <CircularProgress sx={{ color: uiPrimaryColor }} />
                </Box>
          ) : showLoginForm ? (
            <Card
                  sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", sm: "480px", md: "520px" },
                    mx: "auto",
                    borderRadius: 4,
                    boxShadow: `0 8px 32px ${alpha(uiSecondaryColor, 0.15)}`,
                    border: `1px solid ${secondaryLight}`,
                backgroundColor: "#ffffff",
                    overflow: "hidden",
                background: "#ffffff",
                minHeight: 520,
                position: "relative",
                zIndex: 1,
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                    {entryMode === "selection" ? (
                      <>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {tenantIcon ? (
                        tenantIcon.startsWith("data:") ? (
                          <img src={tenantIcon} alt={tenantAlt} width={60} height={60} style={{ objectFit: "contain" }} />
                        ) : (
                          <Image src={tenantIcon} alt={tenantAlt} width={60} height={60} style={{ objectFit: "contain" }} />
                        )
                      ) : null}
                    </Box>
                    
                    {/* Sign In Heading */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: uiPrimaryColor,
                          fontSize: { xs: "1.5rem", sm: "1.8rem" },
                        }}
                      >
                        {t("LEARNER_APP.LOGIN.LOGIN") || "Login"}
                      </Typography>
                    </Box>
                        
                        {/* Description */}
                        <Typography
                      variant="body1"
                          sx={{
                        color: alpha(uiSecondaryColor, 0.75),
                        mb: 3,
                        lineHeight: 1.6,
                        fontSize: { xs: "0.95rem", sm: "1.05rem" },
                          }}
                        >
                          {t("LEARNER_APP.LOGIN.LEARNER_OR_WORKSPACE") ||
                            "Login as a learner or go to the workspace portal."}
                        </Typography>
                        
                        {/* Action Buttons */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setEntryMode("learner")}
                            sx={{
                              backgroundColor: alpha(uiPrimaryColor, 0.7),
                              color: "#ffffff",
                              fontWeight: 600,
                              py: 1.5,
                              borderRadius: 2,
                              boxShadow: `0 4px 12px ${alpha(uiSecondaryColor, 0.3)}`,
                              textTransform: "none",
                              fontSize: "1rem",
                              "&:hover": { 
                                backgroundColor: alpha(uiPrimaryColor, 0.8),
                                boxShadow: `0 6px 20px ${alpha(uiSecondaryColor, 0.4)}`,
                                transform: "translateY(-1px)",
                              },
                              transition: "all 0.2s ease",
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
                              borderColor: alpha(uiPrimaryColor, 0.5),
                              borderWidth: 2,
                             backgroundColor: alpha(uiPrimaryColor, 0.1),
                              color: uiPrimaryColor,
                              fontWeight: 600,
                              py: 1.5,
                              borderRadius: 2,
                              textTransform: "none",
                              fontSize: "1rem",
                            
                              "&:hover": {
                                borderColor: alpha(uiPrimaryColor, 0.7),
                                backgroundColor: alpha(uiPrimaryColor, 0.15),
                                color: uiPrimaryColor,
                                borderWidth: 2,
                              },
                              transition: "all 0.2s ease",
                            }}
                          >
                            {t("LEARNER_APP.LOGIN.GO_TO_WORKSPACE") || "Go to Workspace"}
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <>
                       
                        
                   
                        
                        {/* Login Component */}
                        <LoginComponent
                          onLogin={handleLogin}
                          onVerifyOtp={handleVerifyOtp}
                          handleForgotPassword={handleForgotPassword}
                          handleAddAccount={handleAddAccount}
                          prefilledUsername={prefilledUsername}
                          onBack={() => setEntryMode("selection")}
                          onRedirectToLogin={() => {
                            showToastMessage(
                              "User not registered. Please contact your administrator to register your account.",
                              "error"
                            );
                          }}
                        />
                        
                        {/* Go to Workspace Link */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            mt: 3,
                            pt: 3,
                            borderTop: `1px solid ${secondaryLight}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#000000",
                              fontSize: "0.875rem",
                            }}
                          >
                            Need workspace access?{" "}
                            <Typography
                              component="span"
                              sx={{
                                color: uiPrimaryColor,
                                fontWeight: 600,
                                cursor: "pointer",
                                "&:hover": { 
                                  textDecoration: "underline",
                                  color: primaryDark,
                                },
                                transition: "color 0.2s ease",
                              }}
                              onClick={() => {
                                window.location.href = "https://admin.sunbirdsaas.com/login";
                              }}
                            >
                              Go to Workspace
                            </Typography>
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </Box>
          </Box>

          <style jsx global>{`
            @keyframes float {
              0%,
              100% {
                transform: translateY(0px) scale(1);
              }
              50% {
                transform: translateY(-8px) scale(1.02);
              }
            }
            @media (max-width: 768px) {
              button {
                -webkit-tap-highlight-color: transparent;
              }
              * {
                -webkit-overflow-scrolling: touch;
              }
            }
          `}</style>
        </Box>
      </Suspense>
    </Layout>
  );

  return isSwadhaarTenant ? renderSwadhaarHome() : renderDefaultHome();
}
