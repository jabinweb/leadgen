import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listAvailableModels } from '@/lib/ai/ai-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile to get their Gemini API key
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { geminiApiKey: true },
    });

    // Use user's API key if available (decrypt it first), otherwise use default
    const { decrypt } = require('@/lib/encryption');
    const apiKey = profile?.geminiApiKey ? decrypt(profile.geminiApiKey) : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Gemini API key configured' },
        { status: 400 }
      );
    }

    const models = await listAvailableModels(apiKey);

    console.log('API Route - Models returned:', models.length);

    return NextResponse.json({
      success: true,
      models,
      usingUserKey: !!profile?.geminiApiKey,
      totalModels: models.length,
    });
  } catch (error: any) {
    console.error('Error fetching available models:', error);
    
    // Handle API key errors specifically
    if (error.message?.includes('API key') || error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Gemini API key in settings.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
