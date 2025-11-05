// Helper to get session in API routes (Next-Auth v5)
import { auth } from "@/auth"

export async function getSession() {
  const session = await auth()
  return session
}

export async function requireAuth() {
  const session = await auth()
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }
  return session
}
