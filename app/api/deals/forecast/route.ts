import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dealService } from '@/lib/crm/deal-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forecast = await dealService.getRevenueForecast(session.user.id);
    return NextResponse.json(forecast);
  } catch (error: any) {
    console.error('Error fetching revenue forecast:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
