'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function UsageBanner() {
  const { data: usage } = useQuery({
    queryKey: ['usage-limits'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/usage');
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!usage) return null;

  const { leadsUsed, emailsUsed, leadsLimit, emailsLimit } = usage;
  
  // Calculate percentages
  const leadsPercentage = leadsLimit > 0 
    ? Math.min((leadsUsed / leadsLimit) * 100, 100)
    : 0;
  
  const emailsPercentage = emailsLimit > 0
    ? Math.min((emailsUsed / emailsLimit) * 100, 100)
    : 0;

  // Show warning if usage is above 80%
  const showWarning = leadsPercentage > 80 || emailsPercentage > 80;

  if (!showWarning) return null;

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
              You're approaching your plan limits
            </h3>
            
            <div className="space-y-3 mb-4">
              {leadsPercentage > 80 && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-orange-800 dark:text-orange-200">Leads</span>
                    <span className="text-orange-800 dark:text-orange-200 font-medium">
                      {leadsUsed} / {leadsLimit} used
                    </span>
                  </div>
                  <Progress 
                    value={leadsPercentage} 
                    className="h-2 bg-orange-200 dark:bg-orange-900"
                  />
                </div>
              )}

              {emailsPercentage > 80 && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-orange-800 dark:text-orange-200">Emails</span>
                    <span className="text-orange-800 dark:text-orange-200 font-medium">
                      {emailsUsed} / {emailsLimit} used
                    </span>
                  </div>
                  <Progress 
                    value={emailsPercentage} 
                    className="h-2 bg-orange-200 dark:bg-orange-900"
                  />
                </div>
              )}
            </div>

            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Link href="/pricing">
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade Your Plan
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
