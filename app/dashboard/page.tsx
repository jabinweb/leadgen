'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { LeadsChart } from '@/components/dashboard/leads-chart';
import { ProfileCompletionBanner } from '@/components/dashboard/profile-completion-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Play, Pause, Check, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-scraping-jobs'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-jobs');
      if (!response.ok) throw new Error('Failed to fetch recent jobs');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Play className="h-4 w-4" />;
      case 'COMPLETED':
        return <Check className="h-4 w-4" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'RUNNING':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight hidden lg:block">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/scraping/new">Start New Job</Link>
          </Button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {profile && <ProfileCompletionBanner isComplete={profile.isComplete} />}

      <StatsCards stats={stats!} />

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
        <LeadsChart />
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Scraping Jobs</CardTitle>
            <CardDescription>
              Your latest lead generation activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!recentJobs || recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No scraping jobs yet</p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/scraping/new">
                    Start Your First Job
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs?.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {job.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {job.totalFound} leads found
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                      {job.status === 'RUNNING' && (
                        <div className="w-20">
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}