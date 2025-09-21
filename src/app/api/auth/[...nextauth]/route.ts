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
      return "/medications";
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
        console.log("🔐 Login attempt:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const user = demoUsers.find((u) => u.email === credentials.email);
        if (user && user.password === credentials.password) {
          console.log("✅ User found:", user.name, user.role);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        console.log("❌ Invalid login");
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
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
      }
      return token;
    },

    async session({ session, token }) {
      console.log("📱 Session callback - token role:", token.role);
      if (token && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.name = token.name;
      }
      console.log("📱 Final session:", session.user);
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback - URL:", url, "BaseURL:", baseUrl);

      // Handle signout - redirect to signin page
      if (url.includes("/api/auth/signout") || url.includes("signout")) {
        console.log("🔄 Signout detected, redirecting to signin");
        return `${baseUrl}/auth/signin`;
      }

      // Handle signin success - redirect based on role
      if (url.includes("/api/auth/callback/credentials")) {
        console.log("🔄 Successful signin callback detected");

        return `${baseUrl}/medications`;
      }

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
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        domain: undefined,
      },
    },
  },

  events: {
    async signOut({ token }) {
      console.log("🔄 SignOut event triggered for user:", token?.name);
    },
  },

  debug: true,
});

export { handler as GET, handler as POST };
