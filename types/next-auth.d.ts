import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: string;
    };
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}