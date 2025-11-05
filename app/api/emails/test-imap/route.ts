import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getImapReplyChecker } from '@/lib/email/imap-reply-checker';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checker = await getImapReplyChecker(session.user.id);

    if (!checker.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'IMAP not configured',
          hint: 'Please configure your IMAP settings in Email Settings',
        },
        { status: 400 }
      );
    }

    // Try to connect and test
    console.log('[IMAP Test] Testing connection...');
    
    try {
      const result = await checker.checkForReplies(new Date(Date.now() - 1000)); // Just test last second
      
      return NextResponse.json({
        success: true,
        message: 'IMAP connection successful!',
        details: {
          canConnect: true,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: 'IMAP connection failed',
        error: error.message,
        hint: 'Check your IMAP settings. For Gmail: 1) Enable IMAP in settings, 2) Use App Password instead of regular password',
      });
    }
  } catch (error: any) {
    console.error('Error testing IMAP:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test IMAP connection',
      },
      { status: 500 }
    );
  }
}
