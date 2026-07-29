import crypto from "crypto";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeLoginToken } from "@/lib/tokens";

export const authOptions: AuthOptions = {
  session: {
    // Reine JWT-Session-Strategie ohne DB-Sessions/Accounts-Tabellen,
    // um die Komplexität für ein Credentials-Only-Setup gering zu halten.
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "E-Mail und Passwort",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) return null;

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          contactId: user.contactId ?? null,
        };
      },
    }),
    // Passwortloser Login für Firmenkontakte über den in Vertrags-E-Mails
    // verschickten Link (siehe lib/tokens.ts + app/login/magic/[token]).
    CredentialsProvider({
      id: "magic-link",
      name: "Login-Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const consumed = await consumeLoginToken(credentials.token);
        if (!consumed) return null;

        const contact = await prisma.contact.findUnique({
          where: { id: consumed.contactId },
          include: { user: true },
        });
        if (!contact) return null;

        let user = contact.user;
        if (!user) {
          // Erster Login dieses Kontakts: Portal-Konto automatisch anlegen.
          // Es ist kein "echtes", dem Kunden bekanntes Passwort vorgesehen –
          // der Login erfolgt ausschließlich per Magic Link.
          const randomPassword = crypto.randomBytes(24).toString("hex");
          const passwordHash = await bcrypt.hash(randomPassword, 10);
          try {
            user = await prisma.user.create({
              data: {
                email: contact.email,
                passwordHash,
                name: `${contact.firstName} ${contact.lastName}`,
                role: "CUSTOMER",
                contactId: contact.id,
              },
            });
          } catch {
            // Race Condition / E-Mail bereits als User vorhanden.
            user = await prisma.user.findUnique({ where: { email: contact.email } });
          }
        }
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          contactId: user.contactId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.contactId = (user as any).contactId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).contactId = token.contactId ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
