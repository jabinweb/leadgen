import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkUsageLimits } from '@/lib/subscription';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await checkUsageLimits(session.user.id);

    if (!usage) {
      return NextResponse.json({ error: 'Usage data not found' }, { status: 404 });
    }

    return NextResponse.json({
      leadsUsed: usage.currentUsage.leadsCreated,
      emailsUsed: usage.currentUsage.emailsSent,
      campaignsUsed: usage.currentUsage.campaignsCreated,
      leadsLimit: usage.limits.maxLeads,
      emailsLimit: usage.limits.maxEmails,
      campaignsLimit: usage.limits.maxCampaigns,
    });
  } catch (error: any) {
    console.error('Error checking usage limits:', error);
    return NextResponse.json({ 
      error: 'Failed to check usage limits',
      details: error.message 
    }, { status: 500 });
  }
}
