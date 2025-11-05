import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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
        isComplete: false,
      });
    }

    return NextResponse.json(profile);
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
    } = data;

    // Check if profile is complete
    const isComplete = !!(
      companyName &&
      industry &&
      service &&
      valueProposition
    );

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
        isComplete,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
