import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { quotationService } from '@/lib/quotation-service';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

const updateQuotationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  validityDays: z.number().min(1).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const quotation = await quotationService.getQuotation(id);
    
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const validatedData = await validateRequest(req, updateQuotationSchema);
    
    const quotation = await quotationService.updateQuotation(id, validatedData);

    return NextResponse.json(quotation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    await quotationService.deleteQuotation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
