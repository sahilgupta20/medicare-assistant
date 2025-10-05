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

const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SENIOR":
      return "/medications";
    case "FAMILY":
      return "/family";
    case "CAREGIVER":
      return "/medications";
    case "DOCTOR":
      return "/analytics";
    default:
      return "/family";
  }
};

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
          console.log(" User found:", user.name, user.role);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        console.log(" Invalid login");
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret:
    process.env.NEXTAUTH_SECRET || "medicare-super-secret-key-2024-very-long",

  callbacks: {
    async jwt({ token, user }) {
      console.log(
        "🔑 JWT callback - user:",
        user?.name,
        "token exists:",
        !!token
      );
      if (user) {
        token.role = user.role;
        token.name = user.name;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      console.log("📱 Session callback - token role:", token.role);
      if (token && session.user) {
        session.user.id = token.sub || token.id;
        session.user.role = token.role;
        session.user.name = token.name;
      }
      console.log("📱 Final session:", session.user);
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback - URL:", url, "BaseURL:", baseUrl);

      if (url.includes("/api/auth/signout") || url.includes("signout")) {
        console.log("🔄 Signout detected, redirecting to signin");
        return `${baseUrl}/auth/signin`;
      }

      if (url.includes("/auth/signin")) {
        console.log("🔄 Already on signin page, staying there");
        return url;
      }

      if (url.includes("/api/auth/callback/credentials")) {
        console.log(
          "🔄 Successful signin callback - letting client handle redirect"
        );
        return `${baseUrl}/medications`;
      }

      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`;
        console.log("🔄 Relative URL converted to:", fullUrl);
        return fullUrl;
      }

      // Same domain
      if (url.startsWith(baseUrl)) {
        console.log("🔄 Same domain redirect:", url);
        return url;
      }

      console.log("🔄 Default redirect to base URL");
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
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    },
  },

  events: {
    async signOut({ token }) {
      console.log("🔄 SignOut event triggered for user:", token?.name);
    },
    async signIn({ user }) {
      console.log(`🔄 SignIn event - User: ${user.name} (${user.role})`);
    },
  },

  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
