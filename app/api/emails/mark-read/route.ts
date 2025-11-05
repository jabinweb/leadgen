import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId, replyIds } = await req.json();

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    // Update the email to mark it as read (opened) if it has a reply
    const email = await prisma.emailLog.findFirst({
      where: {
        id: emailId,
        userId: session.user.id,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Only update openedAt if the email has a reply and hasn't been opened yet
    if (email.repliedAt && !email.openedAt) {
      await prisma.emailLog.update({
        where: { id: emailId },
        data: { openedAt: new Date() },
      });
    }

    // Mark individual replies as viewed if replyIds provided
    if (replyIds && Array.isArray(replyIds) && replyIds.length > 0) {
      const viewedAt = new Date().toISOString();
      
      // Get all the reply activities
      const replies = await prisma.leadActivity.findMany({
        where: {
          id: { in: replyIds },
          userId: session.user.id,
          activityType: 'EMAIL_REPLIED',
        },
      });

      // Update each reply's metadata to add viewedAt
      for (const reply of replies) {
        const updatedMetadata = {
          ...(reply.metadata as any),
          viewedAt,
        };

        await prisma.leadActivity.update({
          where: { id: reply.id },
          data: { metadata: updatedMetadata },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking email as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark email as read' },
      { status: 500 }
    );
  }
}
