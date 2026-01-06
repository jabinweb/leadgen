import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { leadScoringService } from '@/lib/crm/lead-scoring-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let leads;
    if (category === 'hot') {
      leads = await leadScoringService.getHotLeads(session.user.id);
    } else if (category === 'warm') {
      leads = await leadScoringService.getWarmLeads(session.user.id);
    } else if (category === 'cold') {
      leads = await leadScoringService.getColdLeads(session.user.id);
    } else {
      const distribution = await leadScoringService.getScoringDistribution(session.user.id);
      return NextResponse.json(distribution);
    }

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads by score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
