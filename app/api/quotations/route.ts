import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { quotationService } from '@/lib/quotation-service';
import { validateRequest } from '@/lib/validation';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

const createQuotationSchema = z.object({
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  validityDays: z.number().min(1).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required'),
      description: z.string().optional(),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price must be positive'),
    })
  ).min(1, 'At least one item is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    
    const validatedData = await validateRequest(req, createQuotationSchema);
    
    const quotation = await quotationService.createQuotation({
      ...validatedData,
      userId: session.user.id,
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

const listQuotationsSchema = z.object({
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const validatedParams = listQuotationsSchema.parse(searchParams);
    
    const result = await quotationService.listQuotations({
      userId: session.user.id,
      ...validatedParams,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
