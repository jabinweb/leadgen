'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, TrendingUp, Clock, Copy, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface StatsCardsProps {
  stats: {
    totalLeads: number;
    totalCompanies: number;
    activeJobs: number;
    weeklyGrowth: number;
    activeCampaigns?: number;
    totalEmailsSent?: number;
    openRate?: number;
    duplicateLeadsCount?: number;
    duplicateGroupsCount?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All time leads collected</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Companies</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Unique companies found</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeJobs}</div>
          <p className="text-xs text-muted-foreground">Currently running</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.weeklyGrowth}%</div>
          <p className="text-xs text-muted-foreground">From last week</p>
        </CardContent>
      </Card>

      {stats.duplicateLeadsCount !== undefined && stats.duplicateLeadsCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicates Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.duplicateLeadsCount}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
              In {stats.duplicateGroupsCount} groups
            </p>
            <Button asChild size="sm" variant="outline" className="text-xs h-7">
              <Link href="/dashboard/duplicates">
                <Copy className="mr-1 h-3 w-3" />
                Review & Merge
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}