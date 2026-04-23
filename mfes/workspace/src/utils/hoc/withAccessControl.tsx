import { useRouter } from "next/router";
import { useEffect } from "react";
import useStore from "../../store/store";
import { Role } from "../app.constant";

const withAccessControl =
  (action: string, accessControl: { [key: string]: Role[] }) =>
  (Component: React.ComponentType<any>) => {
    const WrappedComponent = (props: any) => {
      const store = useStore();
      const userRole = store.userRole;
      const accessToken = store.accessToken;
      const router = useRouter();

      useEffect(() => {
        // Check localStorage as fallback if store isn't initialized yet
        const localToken =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // Check multiple possible locations for role
        let localRole = null;
        if (typeof window !== "undefined") {
          // Try direct role key
          localRole = localStorage.getItem("role");
          // Try adminInfo JSON object
          if (!localRole) {
            try {
              const adminInfo = localStorage.getItem("adminInfo");
              if (adminInfo) {
                const parsed = JSON.parse(adminInfo);
                localRole = parsed?.role;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }

        const token = accessToken || localToken;
        const role = userRole || localRole;

        // Normalize role for comparison (Role enum values: "Teacher", "Lead", "Student", "Admin")
        const normalizedRole = role?.trim();
        const allowedRoles = accessControl[action] || [];
        const hasAccess =
          normalizedRole && allowedRoles.includes(normalizedRole as any);

        console.log("withAccessControl check:", {
          action,
          userRole,
          localRole,
          normalizedRole,
          token: !!token,
          allowedRoles,
          hasAccess,
          roleValues: Object.values(Role),
        });

        if (!token?.length || !normalizedRole) {
          // Redirect to login if not authenticated
          if (typeof window !== "undefined") {
            const loginUrl =
              process.env.NEXT_PUBLIC_ADMIN_LOGIN_URL || "/login";
            console.log("No token/role, redirecting to:", loginUrl);
            window.location.href = loginUrl;
          }
          return;
        }

        // Don't redirect if no access, just log it (component will return null)
        if (!hasAccess) {
          console.warn(
            "Access denied for role:",
            normalizedRole,
            "action:",
            action,
            "allowed:",
            allowedRoles
          );
        }
      }, [userRole, action, router, accessToken]);

      // Check localStorage as fallback if store isn't initialized yet
      let localRole = null;
      if (typeof window !== "undefined") {
        localRole = localStorage.getItem("role");
        if (!localRole) {
          try {
            const adminInfo = localStorage.getItem("adminInfo");
            if (adminInfo) {
              const parsed = JSON.parse(adminInfo);
              localRole = parsed?.role;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      const role = userRole || localRole;
      const normalizedRole = role?.trim();
      const allowedRoles = accessControl[action] || [];
      const hasAccess =
        normalizedRole && allowedRoles.includes(normalizedRole as any);

      if (!hasAccess) {
        console.log("Render blocked - no access:", {
          role: normalizedRole,
          action,
          allowedRoles,
          userRole,
          localRole,
        });
        return null;
      }

      return <Component {...props} />;
    };

    // Setting the display name for better debugging and developer tools
    WrappedComponent.displayName = `withAccessControl(${
      Component.displayName ?? Component.name ?? "Component"
    })`;

    return WrappedComponent;
  };

export default withAccessControl;
