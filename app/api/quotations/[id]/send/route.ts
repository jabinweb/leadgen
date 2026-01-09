import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { quotationService } from '@/lib/quotation-service';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const quotation = await quotationService.sendQuotation(id);

    return NextResponse.json(quotation);
  } catch (error) {
    return handleApiError(error);
  }
}
