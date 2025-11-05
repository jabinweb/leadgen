import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, createEmailHTML } from '@/lib/email/nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftId } = body;

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    // Fetch the draft
    const draft = await prisma.emailDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Verify ownership
    if (draft.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already sent
    if (draft.status === 'SENT') {
      return NextResponse.json({ error: 'Email already sent' }, { status: 400 });
    }

    // Validate recipient email
    if (!draft.recipientEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(draft.recipientEmail)) {
      return NextResponse.json({ error: 'Invalid recipient email format' }, { status: 400 });
    }

    // Check SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please set up SMTP credentials in environment variables.' 
      }, { status: 500 });
    }

    // Create HTML email
    const emailHTML = createEmailHTML(draft.body);

    // Send email
    const result = await sendEmail({
      to: draft.recipientEmail,
      subject: draft.subject,
      html: emailHTML,
      text: draft.body,
    });

    // Update draft status to SENT
    await prisma.emailDraft.update({
      where: { id: draftId },
      data: { 
        status: 'SENT',
        updatedAt: new Date(),
      },
    });

    // If leadId exists, update lead activity
    if (draft.leadId) {
      try {
        await prisma.lead.update({
          where: { id: draft.leadId },
          data: {
            lastContactedAt: new Date(),
            status: 'CONTACTED',
          },
        });
      } catch (error) {
        console.error('Failed to update lead:', error);
        // Don't fail the request if lead update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId,
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Handle specific nodemailer errors
    if (error.code === 'EAUTH') {
      return NextResponse.json({ 
        error: 'Authentication failed. Please check your SMTP credentials.' 
      }, { status: 500 });
    }
    
    if (error.code === 'ECONNECTION') {
      return NextResponse.json({ 
        error: 'Failed to connect to email server. Please check your SMTP settings.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 });
  }
}
