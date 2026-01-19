import type { NextAuthConfig } from "next-auth";

/**
 * Auth configuration for edge runtime (middleware)
 * This config doesn't include bcrypt or Prisma (not edge-compatible)
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuth = nextUrl.pathname.startsWith("/login") || 
                       nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isOnAuth && isLoggedIn) {
        // Redirect authenticated users to dashboard
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
