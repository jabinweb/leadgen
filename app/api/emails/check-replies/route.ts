import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getImapReplyChecker } from '@/lib/email/imap-reply-checker';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checker = getImapReplyChecker();

    if (!checker.isConfigured()) {
      return NextResponse.json(
        {
          error: 'IMAP not configured',
          message: 'Please set IMAP_USER, IMAP_PASSWORD, IMAP_HOST, and IMAP_PORT in your .env file',
        },
        { status: 400 }
      );
    }

    // Optional: check only emails from the last N days
    const body = await req.json().catch(() => ({}));
    const daysBack = body.daysBack || 7;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    console.log(`Checking for replies since ${since.toISOString()}`);

    const result = await checker.checkForReplies(since);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      message: `Processed ${result.processed} replies${
        result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''
      }`,
    });
  } catch (error: any) {
    console.error('Error checking replies:', error);
    return NextResponse.json(
      {
        error: 'Failed to check replies',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const checker = getImapReplyChecker();

  return NextResponse.json({
    configured: checker.isConfigured(),
    instructions: {
      step1: 'Add IMAP credentials to .env file',
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
}
