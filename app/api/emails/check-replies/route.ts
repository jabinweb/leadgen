import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getImapReplyChecker } from '@/lib/email/imap-reply-checker';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get checker with user's IMAP config or fallback to default
    const checker = await getImapReplyChecker(session.user.id);

    if (!checker.isConfigured()) {
      return NextResponse.json(
        {
          error: 'IMAP not configured',
          message: 'Please configure IMAP settings in Email Settings. Go to Dashboard > Emails > Email Settings to add your IMAP credentials.',
          hint: 'For Gmail: Enable IMAP in Gmail settings and use an App Password instead of your regular password.',
        },
        { status: 400 }
      );
    }

    // Optional: check only emails from the last N days
    const body = await req.json().catch(() => ({}));
    const daysBack = body.daysBack || 7;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    console.log(`[IMAP] Checking for replies since ${since.toISOString()} for user ${session.user.id}`);

    const result = await checker.checkForReplies(since);

    console.log(`[IMAP] Processed ${result.processed} replies, ${result.errors.length} errors`);
    
    if (result.errors.length > 0) {
      console.error('[IMAP] Errors:', result.errors);
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      message: result.processed > 0 
        ? `Found ${result.processed} new ${result.processed === 1 ? 'reply' : 'replies'}!`
        : result.errors.length > 0
        ? `No replies found. ${result.errors.length} error(s) occurred.`
        : 'No new replies found in your inbox.',
    });
  } catch (error: any) {
    console.error('[IMAP] Error checking replies:', error);
    return NextResponse.json(
      {
        error: 'Failed to check replies',
        message: error.message,
        hint: 'Check your IMAP settings in Email Settings. Make sure your credentials are correct and IMAP is enabled for your email account.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const checker = await getImapReplyChecker(userId);

    return NextResponse.json({
      configured: checker.isConfigured(),
      instructions: {
        step1: 'Configure IMAP credentials in Settings or add to .env file',
        step2: 'For Gmail, enable IMAP and use an App Password',
        step3: 'POST to this endpoint to check for new replies',
        variables: {
          IMAP_HOST: 'imap.gmail.com',
          IMAP_PORT: '993',
          IMAP_USER: 'your-email@gmail.com',
          IMAP_PASSWORD: 'your-app-password',
          IMAP_TLS: 'true',
        },
        usage: 'POST /api/emails/check-replies with optional JSON body: { "daysBack": 7 }',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
