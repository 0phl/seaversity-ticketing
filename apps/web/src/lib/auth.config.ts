import type { NextAuthConfig } from "next-auth";

/**
 * Protected routes that require authentication
 */
const protectedRoutes = ["/dashboard", "/tickets", "/tasks", "/projects", "/settings", "/reports"];

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
      const isProtectedRoute = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isProtectedRoute) {
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
