'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Play, 
  Check, 
  AlertCircle, 
  Clock,
  Square,
  Download
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ScrapingJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const { data: job, isLoading, refetch } = useQuery({
    queryKey: ['scraping-job', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/scraping/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    },
    refetchInterval: 3000,
  });

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/scraping/jobs/${jobId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }

      toast.success('Job cancelled successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/scraping/jobs/${jobId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry job');
      }

      toast.success('Job restarted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to retry job');
    }
  };

  const handleExportLeads = async () => {
    try {
      const response = await fetch(`/api/leads/export?scrapingJobId=${jobId}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `leads-${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Leads exported successfully');
    } catch (error) {
      toast.error('Failed to export leads');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5" />;
      case 'RUNNING':
        return <Play className="h-5 w-5" />;
      case 'COMPLETED':
        return <Check className="h-5 w-5" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5" />;
      case 'CANCELLED':
        return <Square className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PENDING':
        return 'outline';
      case 'RUNNING':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-1 space-y-4">
        <div className="text-center py-8">
          <p className="text-red-500">Job not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/scraping">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/scraping">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{job.name}</h2>
            <p className="text-muted-foreground">Job ID: {job.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {job.status === 'RUNNING' && (
            <Button variant="destructive" onClick={handleCancel}>
              <Square className="mr-2 h-4 w-4" />
              Cancel Job
            </Button>
          )}
          {job.status === 'FAILED' && (
            <Button onClick={handleRetry}>
              <Play className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          {job.status === 'COMPLETED' && job._count?.leads > 0 && (
            <Button onClick={handleExportLeads}>
              <Download className="mr-2 h-4 w-4" />
              Export Leads
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(job.status)}
            <span>Job Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(job.status)} className="mt-1">
                {job.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{job.progress}%</span>
                  <span>{job.totalFound} found</span>
                </div>
                <Progress value={job.progress} className="h-2" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success</p>
              <p className="text-2xl font-bold text-green-600">{job.successCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leads Collected</p>
              <p className="text-2xl font-bold">{job._count?.leads || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Target Website</p>
              <p className="text-lg">{job.targetWebsite}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Search Query</p>
              <p className="text-lg">{job.searchQuery}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Results</p>
              <p className="text-lg">{job.maxResults}</p>
            </div>
            {job.configuration && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Additional Config</p>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(job.configuration, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-lg">{format(new Date(job.createdAt), 'PPpp')}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </p>
            </div>
            {job.startedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Started</p>
                <p className="text-lg">{format(new Date(job.startedAt), 'PPpp')}</p>
              </div>
            )}
            {job.completedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-lg">{format(new Date(job.completedAt), 'PPpp')}</p>
              </div>
            )}
            {job.errorMessage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error</p>
                <p className="text-sm text-red-600">{job.errorMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Leads */}
      {job._count?.leads > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Collected Leads</CardTitle>
            <CardDescription>
              {job._count.leads} leads collected from this job
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/dashboard/leads?scrapingJobId=${job.id}`}>
                View All Leads
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
