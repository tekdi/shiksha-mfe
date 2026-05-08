/**
 * Auth utility helpers for Swadhaar learner app.
 * Used by SplashScreen to check session validity without full redux.
 */

/**
 * Decode a JWT payload (no verification – client side only for UX gating).
 */
function decodeJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Returns true if a non-expired token exists in localStorage.
 */
export function isTokenValid(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (!token) return false;

  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return false;

  // exp is in seconds; add 30s buffer
  return payload.exp > Date.now() / 1000 + 30;
}

/**
 * Returns the userId stored in localStorage (set after login).
 */
export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId");
}

/**
 * Returns the stored user's first name (for greeting).
 */
export function getStoredUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("name") || localStorage.getItem("firstName") || "";
}
