import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Only build the adapter when DATABASE_URL is present (guards against build-time crash)
const adapter = process.env.DATABASE_URL ? DrizzleAdapter(getDb()) : undefined

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    // Google OAuth disabled for now — will re-enable later
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    //   authorization: {
    //     params: {
    //       prompt: 'select_account',
    //     },
    //   },
    // }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        if (!process.env.DATABASE_URL) return null
        const db = getDb()
        const email = String(credentials.email).trim().toLowerCase()
        const [user] = await db.select().from(users).where(eq(users.email, email))
        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!ok) return null
        return { id: String(user.id), name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // En el login inicial viene el usuario.
      if (user) {
        token.id = (user as any).id ?? user.id
        token.role = (user as any).role
      }
      // El rol se relee de la BD en cada comprobación: así, promover o quitar admin
      // surte efecto de inmediato (sin esperar a que caduque el token).
      if (token.email && process.env.DATABASE_URL) {
        try {
          const [u] = await getDb()
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, String(token.email).toLowerCase()))
          if (!u) return null // cuenta borrada → cerrar sesión
          token.id = String(u.id)
          token.role = u.role
        } catch {
          // Si la BD falla, se mantiene el rol del token.
        }
      }
      if (!token.role) token.role = 'traveler'
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
})
