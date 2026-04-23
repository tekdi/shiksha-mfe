const baseurl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL
const API_ENDPOINTS = {
  accountLogin: `${baseurl}/account/login`,
  authRefresh: `${baseurl}/account/auth/refresh`,
  authLogout: `${baseurl}/account/auth/logout`,
  userAuth: `${baseurl}/user/auth`,
  resetPassword: `${baseurl}/user/reset-password`,
  forgotPassword: `${baseurl}/user/forgot-password`,
  passwordResetLink: `${baseurl}/user/password-reset-link`,
};

export default API_ENDPOINTS;
