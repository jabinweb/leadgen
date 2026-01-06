import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { templateService } from '@/lib/email/template-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, leadData } = body;

    if (!templateId || !leadData) {
      return NextResponse.json(
        { error: 'Template ID and lead data are required' },
        { status: 400 }
      );
    }

    const result = await templateService.applyTemplate(
      templateId,
      session.user.id,
      leadData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Template apply error:', error);
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}
