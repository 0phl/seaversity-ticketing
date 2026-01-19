import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@seaversity/database";
import { authConfig } from "./auth.config";

// Login validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const config: NextAuthConfig = {
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate credentials
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            teamId: true,
            avatar: true,
            isActive: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if user is active
        if (!user.isActive) {
          return null;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Return user data (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.teamId = user.teamId as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.teamId = token.teamId as string | null;
      }
      return session;
    },
  },
};

// Create and export the NextAuth instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextAuth = NextAuth(config) as any;

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

/**
 * Helper to hash passwords
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Helper to verify passwords
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
