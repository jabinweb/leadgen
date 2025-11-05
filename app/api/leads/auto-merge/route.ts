import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { autoMergeDuplicates } from '@/lib/leads/duplicate-detector';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exactMatchOnly = true } = body;

    const result = await autoMergeDuplicates(session.user.id, exactMatchOnly);

    return NextResponse.json({
      success: true,
      message: `Successfully auto-merged ${result.mergedCount} duplicate leads across ${result.groupsProcessed} groups`,
      mergedCount: result.mergedCount,
      groupsProcessed: result.groupsProcessed,
    });

  } catch (error: any) {
    console.error('Error auto-merging duplicates:', error);
    return NextResponse.json({ 
      error: 'Failed to auto-merge duplicates',
      details: error.message 
    }, { status: 500 });
  }
}
