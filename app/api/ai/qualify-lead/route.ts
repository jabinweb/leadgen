import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { qualifyLead } from '@/lib/ai/ai-service';

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
    const { 
      companyName, 
      industry, 
      website, 
      email, 
      phone, 
      revenue, 
      employeeCount, 
      description, 
      source,
      targetCriteria 
    } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const qualification = await qualifyLead({
      companyName,
      industry,
      website,
      email,
      phone,
      revenue,
      employeeCount,
      description,
      source,
      targetCriteria,
    });

    return NextResponse.json({
      success: true,
      qualification,
    });

  } catch (error: any) {
    console.error('AI Lead Qualification Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to qualify lead' },
      { status: 500 }
    );
  }
}
