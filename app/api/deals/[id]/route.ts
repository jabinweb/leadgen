import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dealService } from '@/lib/crm/deal-service';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await req.json();
    const deal = await dealService.updateDeal(params.id, body);

    return NextResponse.json(deal);
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    await dealService.deleteDeal(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
