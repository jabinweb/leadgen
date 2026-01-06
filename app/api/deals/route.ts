import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dealService } from '@/lib/crm/deal-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage') as any;

    const deals = await dealService.getUserDeals(session.user.id, stage);
    return NextResponse.json(deals);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, value, currency, leadId, expectedCloseDate } = body;

    if (!title || !value || !leadId) {
      return NextResponse.json(
        { error: 'Title, value, and leadId are required' },
        { status: 400 }
      );
    }

    const deal = await dealService.createDeal(session.user.id, {
      title,
      value,
      currency: currency || 'USD',
      leadId,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
