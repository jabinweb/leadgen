import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/emails/drafts/bulk-delete - Delete multiple drafts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { draftIds } = body;

    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return NextResponse.json(
        { error: 'Draft IDs array is required' },
        { status: 400 }
      );
    }

    // Delete only drafts that belong to the user
    const result = await prisma.emailDraft.deleteMany({
      where: {
        id: { in: draftIds },
        userId: user.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    });
  } catch (error) {
    console.error('Error bulk deleting email drafts:', error);
    return NextResponse.json(
      { error: 'Failed to delete email drafts' },
      { status: 500 }
    );
  }
}
