import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/emails/drafts/[id] - Delete a single draft
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await context.params;
    const { id } = params;

    // Verify the draft belongs to the user
    const draft = await prisma.emailDraft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.emailDraft.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete email draft' },
      { status: 500 }
    );
  }
}

// PATCH /api/emails/drafts/[id] - Update a draft
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { subject, emailBody, status } = body;

    // Verify the draft belongs to the user
    const draft = await prisma.emailDraft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedDraft = await prisma.emailDraft.update({
      where: { id },
      data: {
        ...(subject && { subject }),
        ...(emailBody && { body: emailBody }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ draft: updatedDraft });
  } catch (error) {
    console.error('Error updating email draft:', error);
    return NextResponse.json(
      { error: 'Failed to update email draft' },
      { status: 500 }
    );
  }
}
