import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const demoUsers = [
  {
    id: "1",
    email: "admin@medicare.com",
    password: "password",
    name: "Admin User",
    role: "ADMIN",
  },
  {
    id: "2",
    email: "senior@medicare.com",
    password: "password",
    name: "Papa Singh",
    role: "SENIOR",
  },
  {
    id: "3",
    email: "family@medicare.com",
    password: "password",
    name: "Raj Singh",
    role: "FAMILY",
  },
  {
    id: "4",
    email: "caregiver@medicare.com",
    password: "password",
    name: "Nurse Johnson",
    role: "CAREGIVER",
  },
  {
    id: "5",
    email: "doctor@medicare.com",
    password: "password",
    name: "Dr. Smith",
    role: "DOCTOR",
  },
];

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log(" Login attempt:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log(" Missing credentials");
          return null;
        }

        const user = demoUsers.find((u) => u.email === credentials.email);
        if (user && user.password === credentials.password) {
          console.log(" User authenticated:", user.name, user.role);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        console.log(" Invalid credentials");
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60,
  },

  secret:
    process.env.NEXTAUTH_SECRET || "medicare-super-secret-key-2024-very-long",

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.name = user.name;
        token.id = user.id;
        console.log(" JWT created for:", user.name, "Role:", user.role);
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      console.log(" Session created:", session.user);
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log(" Redirect callback - url:", url, "baseUrl:", baseUrl);

      // Handle signout
      if (url.includes("signout")) {
        console.log(" Signing out, redirecting to signin");
        return `${baseUrl}/auth/signin`;
      }

      if (url.includes("/api/auth/callback")) {
        console.log(" Login successful, redirecting to root");
        return baseUrl;
      }

      if (url.startsWith("/")) {
        console.log(" Relative URL:", url);
        return `${baseUrl}${url}`;
      }

      // If URL is same origin, allow it
      if (url.startsWith(baseUrl)) {
        console.log(" Same origin redirect:", url);
        return url;
      }

      // Default fallback to root
      console.log(" Default redirect to root");
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin",
    error: "/auth/signin",
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  events: {
    async signOut({ token }) {
      console.log(" SignOut event for:", token?.name);
    },
    async signIn({ user }) {
      console.log(` SignIn event: ${user.name} (${user.role})`);
    },
  },

  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
