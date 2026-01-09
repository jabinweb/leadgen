import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { invoiceService } from '@/lib/invoice-service';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    
    const stats = await invoiceService.getInvoiceStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
