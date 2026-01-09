import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { quotationService } from '@/lib/quotation-service';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

const convertSchema = z.object({
  dueInDays: z.number().min(1).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const { dueInDays } = await validateRequest(req, convertSchema);
    
    const invoice = await quotationService.convertToInvoice(id, dueInDays);

    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}
