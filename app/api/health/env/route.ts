import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_USER: !!process.env.SMTP_USER,
    NODE_ENV: process.env.NODE_ENV,
  }
  
  return NextResponse.json(envCheck)
}
