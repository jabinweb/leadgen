import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await req.json();

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    // Verify the email belongs to the user before deleting
    const email = await prisma.emailLog.findFirst({
      where: {
        id: emailId,
        userId: session.user.id,
      },
      select: {
        id: true,
        to: true,
        subject: true,
        repliedAt: true,
        replySubject: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Log what we're deleting
    console.log(`[Delete] Deleting email ${email.id} to ${email.to}`);
    if (email.repliedAt) {
      console.log(`[Delete] This email has a reply that will be deleted: ${email.replySubject}`);
    }

    // Delete the email (this also removes all reply data since it's in the same record)
    await prisma.emailLog.delete({
      where: { id: emailId },
    });

    console.log(`[Delete] Successfully deleted email ${emailId}`);

    return NextResponse.json({ 
      success: true, 
      message: email.repliedAt 
        ? 'Email and its reply deleted successfully' 
        : 'Email deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete email' },
      { status: 500 }
    );
  }
}
