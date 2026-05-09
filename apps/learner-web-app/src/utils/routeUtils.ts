/**
 * Shared public route definitions and matching logic.
 *
 * Both AuthGuard (client-side) and middleware (server-side) need to
 * agree on which routes are public. Keeping one list here avoids
 * drift between the two.
 */

// Routes that don't require authentication.
// The middleware may extend this list with additional sub-routes for
// POS/thematic pages, but these are the base set.
export const publicRoutes: string[] = [
  "/",
  "/login",
  "/register",
  "/home",
  "/faqs",
  "/explore",
  "/unauthorized",
  "/pos",
  "/themantic",
];

/**
 * Check whether a given pathname matches any public route.
 *
 * - "/" is matched exactly (so "/dashboard" doesn't slip through).
 * - Other routes match exactly or as a segment prefix ("/pos" matches
 *   "/pos/program" but not "/position").
 */
export const isPublicRoute = (
  pathname: string,
  routes: string[] = publicRoutes
): boolean => {
  return routes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
};
