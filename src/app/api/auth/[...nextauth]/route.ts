import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const demoUsers = [
  {
    id: "1",
    email: "admin@medicare.com",
    password: "password",
    name: "Admin User",
    role: "ADMIN"
  },
  {
    id: "2", 
    email: "senior@medicare.com",
    password: "password",
    name: "Papa Singh",
    role: "SENIOR"
  },
  {
    id: "3",
    email: "family@medicare.com", 
    password: "password",
    name: "Raj Singh",
    role: "FAMILY"
  }
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = demoUsers.find(u => u.email === credentials.email)
        if (!user || user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt"
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
    
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  }
})

export { handler as GET, handler as POST }