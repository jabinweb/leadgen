import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyzeSentiment } from '@/lib/ai/ai-service';

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
    const { replyContent, originalEmail, context } = body;

    if (!replyContent) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeSentiment({
      replyContent,
      originalEmail,
      context,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error: any) {
    console.error('AI Sentiment Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
