import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      // Return empty profile if not exists
      return NextResponse.json({
        companyName: '',
        industry: '',
        companySize: '',
        website: '',
        description: '',
        service: '',
        targetAudience: '',
        valueProposition: '',
        companyEmail: '',
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpFrom: '',
        imapHost: '',
        imapPort: 993,
        imapSecure: true,
        imapUser: '',
        aiModel: 'gemini-2.0-flash',
        isComplete: false,
      });
    }

    // Don't return encrypted passwords/keys, but indicate if they exist
    const { smtpPassword, imapPassword, geminiApiKey, googlePlacesApiKey, ...profileData } = profile;
    return NextResponse.json({
      ...profileData,
      hasSmtpPassword: !!smtpPassword,
      hasImapPassword: !!imapPassword,
      geminiApiKey: geminiApiKey ? '••••••••' : '',
      googlePlacesApiKey: googlePlacesApiKey ? '••••••••' : '',
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      companyName,
      industry,
      companySize,
      website,
      description,
      service,
      targetAudience,
      valueProposition,
      companyEmail,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
      smtpFrom,
      imapHost,
      imapPort,
      imapSecure,
      imapUser,
      imapPassword,
      geminiApiKey,
      googlePlacesApiKey,
      aiModel,
    } = data;

    // Encrypt SMTP password if provided (skip placeholder bullets)
    let encryptedSmtpPassword: string | undefined;
    if (smtpPassword && smtpPassword !== '••••••••') {
      encryptedSmtpPassword = encrypt(smtpPassword);
      console.log('SMTP password encrypted');
    }

    // Encrypt IMAP password if provided (skip placeholder bullets)
    let encryptedImapPassword: string | undefined;
    if (imapPassword && imapPassword !== '••••••••') {
      encryptedImapPassword = encrypt(imapPassword);
      console.log('IMAP password encrypted');
    }

    // Encrypt API keys if provided (skip placeholder bullets)
    let encryptedGeminiApiKey: string | undefined;
    if (geminiApiKey && geminiApiKey !== '••••••••') {
      encryptedGeminiApiKey = encrypt(geminiApiKey);
      console.log('Gemini API key encrypted');
    }

    let encryptedGooglePlacesApiKey: string | undefined;
    if (googlePlacesApiKey && googlePlacesApiKey !== '••••••••') {
      encryptedGooglePlacesApiKey = encrypt(googlePlacesApiKey);
      console.log('Google Places API key encrypted');
    }

    // Check if profile is complete
    const isComplete = !!(
      companyName &&
      industry &&
      service &&
      valueProposition
    );

    // Get existing profile to preserve passwords/keys if not updating
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { 
        smtpPassword: true,
        imapPassword: true,
        geminiApiKey: true,
        googlePlacesApiKey: true,
      },
    });

    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        companyName,
        industry,
        companySize,
        website,
        description,
        service,
        targetAudience,
        valueProposition,
        companyEmail,
        smtpHost,
        smtpPort: parseInt(smtpPort) || 587,
        smtpSecure: smtpSecure === 'true' || smtpSecure === true,
        smtpUser,
        smtpPassword: encryptedSmtpPassword || existingProfile?.smtpPassword, // Keep existing if not updating
        smtpFrom,
        imapHost,
        imapPort: parseInt(imapPort) || 993,
        imapSecure: imapSecure === 'true' || imapSecure === true,
        imapUser,
        imapPassword: encryptedImapPassword || existingProfile?.imapPassword, // Keep existing if not updating
        geminiApiKey: encryptedGeminiApiKey || existingProfile?.geminiApiKey, // Keep existing if not updating
        googlePlacesApiKey: encryptedGooglePlacesApiKey || existingProfile?.googlePlacesApiKey, // Keep existing if not updating
        aiModel: aiModel || 'gemini-2.0-flash',
        isComplete,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        companyName,
        industry,
        companySize,
        website,
        description,
        service,
        targetAudience,
        valueProposition,
        companyEmail,
        smtpHost,
        smtpPort: parseInt(smtpPort) || 587,
        smtpSecure: smtpSecure === 'true' || smtpSecure === true,
        smtpUser,
        smtpPassword: encryptedSmtpPassword,
        smtpFrom,
        imapHost,
        imapPort: parseInt(imapPort) || 993,
        imapSecure: imapSecure === 'true' || imapSecure === true,
        imapUser,
        imapPassword: encryptedImapPassword,
        geminiApiKey: encryptedGeminiApiKey,
        googlePlacesApiKey: encryptedGooglePlacesApiKey,
        aiModel: aiModel || 'gemini-2.0-flash',
        isComplete,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
