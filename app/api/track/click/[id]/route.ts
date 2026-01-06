import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // Update email log with click timestamp
    await prisma.emailLog.update({
      where: { id },
      data: { 
        clickedAt: new Date(),
        status: 'CLICKED'
      },
    });

    // Redirect to actual URL
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Click tracking error:', error);
    
    // Fallback: redirect to URL if provided, otherwise error
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (url) {
      return NextResponse.redirect(url);
    }
    
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
