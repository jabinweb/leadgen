import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { invoiceService } from '@/lib/invoice-service';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  paymentMethod: z.string().optional(),
  paymentDetails: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const validatedData = await validateRequest(req, paymentSchema);
    
    const invoice = await invoiceService.recordPayment(id, validatedData);

    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}
