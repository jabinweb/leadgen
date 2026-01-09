import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { invoiceService } from '@/lib/invoice-service';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const invoice = await invoiceService.sendInvoice(id);

    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}
