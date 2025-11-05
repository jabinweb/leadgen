'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Building, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProfileCompletionBannerProps {
  isComplete: boolean;
}

export function ProfileCompletionBanner({ isComplete }: ProfileCompletionBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isComplete || isDismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Building className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold">
        Complete Your Business Profile
      </AlertTitle>
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Add your business information to generate better personalized cold emails with AI. 
            It only takes 2 minutes!
          </p>
          <div className="flex items-center space-x-2 ml-4">
            <Button 
              size="sm" 
              onClick={() => router.push('/dashboard/settings')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Complete Profile
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
