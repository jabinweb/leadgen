import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { optimizeEmailContent } from '@/lib/ai/ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, companyName, goal, targetAudience } = body;

    if (!content || !companyName) {
      return NextResponse.json(
        { error: 'Content and company name are required' },
        { status: 400 }
      );
    }

    const optimization = await optimizeEmailContent({
      content,
      companyName,
      goal,
      targetAudience,
    });

    return NextResponse.json({
      success: true,
      optimization,
    });

  } catch (error: any) {
    console.error('AI Content Optimization Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize content' },
      { status: 500 }
    );
  }
}
