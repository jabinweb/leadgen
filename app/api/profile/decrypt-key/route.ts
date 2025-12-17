import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyType } = await request.json();

    if (!keyType || !['geminiApiKey', 'googlePlacesApiKey'].includes(keyType)) {
      return NextResponse.json({ error: 'Invalid key type' }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        geminiApiKey: keyType === 'geminiApiKey',
        googlePlacesApiKey: keyType === 'googlePlacesApiKey',
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const encryptedKey = profile[keyType as keyof typeof profile];
    
    if (!encryptedKey || encryptedKey === '••••••••') {
      return NextResponse.json({ decryptedKey: '' });
    }

    try {
      const decryptedKey = decrypt(encryptedKey as string);
      return NextResponse.json({ decryptedKey });
    } catch (error) {
      console.error('Failed to decrypt key:', error);
      return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error decrypting key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
