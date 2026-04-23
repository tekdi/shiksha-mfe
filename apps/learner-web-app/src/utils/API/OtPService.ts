import { API_ENDPOINTS, INTERFACE_API_ENDPOINTS } from "./EndUrls";
import { post } from "./RestClient";

interface SendOTPParams {
  mobile: string;
  reason: string;
}
interface VerifyOTPParams {
  mobile: string;
  reason: string;
  otp: string;
  hash: string;
  username?: string;
}

interface SendOtpInterfaceParams {
  mobile: string;
  reason: string;
  key: string;
  replacements: {
    "{eventName}": string;
    "{programName}": string;
  };
}

export const sendOTP = async ({
  mobile,
  reason,
}: SendOTPParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.sendOTP;

  try {
    const response = await post(apiUrl, { mobile, reason });
    return response?.data;
  } catch (error) {
    console.error("error in login", error);
    throw error;
  }
};

export const sendOtpInterface = async ({
  mobile,
  reason,
  key,
  replacements,
}: SendOtpInterfaceParams): Promise<any> => {
  const apiUrl: string = INTERFACE_API_ENDPOINTS.sendOtp;

  try {
    const response = await post(apiUrl, {
      mobile,
      reason,
      key,
      replacements,
    });
    return response?.data;
  } catch (error) {
    console.error("error in sending OTP via interface API", error);
    throw error;
  }
};

export const verifyOTP = async ({
  mobile,
  reason,
  otp,
  hash,
  username,
}: VerifyOTPParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.verifyOTP;

  try {
    const response = await post(apiUrl, {
      mobile,
      reason,
      otp,
      hash,
      username,
    });
    return response?.data;
  } catch (error) {
    console.error("error in login", error);
    throw error;
  }
};
