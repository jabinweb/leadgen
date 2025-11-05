import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateSubjectLines } from '@/lib/ai/ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyName, industry, productService, targetAudience, tone, count } = body;

    if (!companyName || !productService) {
      return NextResponse.json(
        { error: 'Company name and product/service are required' },
        { status: 400 }
      );
    }

    const variants = await generateSubjectLines({
      companyName,
      industry,
      productService,
      targetAudience,
      tone,
      count: count || 5,
    });

    return NextResponse.json({
      success: true,
      variants,
    });

  } catch (error: any) {
    console.error('AI Subject Line Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate subject lines' },
      { status: 500 }
    );
  }
}
