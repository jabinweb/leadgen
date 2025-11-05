'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Play, 
  Pause, 
  Square, 
  Check, 
  AlertCircle, 
  Clock,
  Plus,
  Eye,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ScrapingJobsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const router = useRouter();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['scraping-jobs', { page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/scraping/jobs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scraping jobs');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const { data: queueStatus } = useQuery({
    queryKey: ['scraping-status'],
    queryFn: async () => {
      const response = await fetch('/api/scraping/status');
      if (!response.ok) {
        throw new Error('Failed to fetch queue status');
      }
      return response.json();
    },
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'RUNNING':
        return <Play className="h-4 w-4" />;
      case 'COMPLETED':
        return <Check className="h-4 w-4" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <Square className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
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

  const handleViewJob = (jobId: string) => {
    router.push(`/dashboard/scraping/${jobId}`);
  };

  const handleCancelJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleRetryJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleViewLeads = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/leads?scrapingJobId=${jobId}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allJobIds = data?.jobs?.map((job: any) => job.id) || [];
      setSelectedJobs(allJobIds);
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    if (checked) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select jobs to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedJobs.length} job(s)? This will also delete all associated leads.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/scraping/jobs/bulk-delete?ids=${selectedJobs.join(',')}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete jobs');
      }

      const result = await response.json();
      toast.success(result.message || `Deleted ${selectedJobs.length} job(s)`);
      setSelectedJobs([]);
      refetch();
    } catch (error) {
      console.error('Error deleting jobs:', error);
      toast.error('Failed to delete jobs');
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Scraping Jobs</h2>
        <div className="flex items-center space-x-2">
          {selectedJobs.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedJobs.length} selected
              </span>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </>
          )}
          <Button asChild>
            <Link href="/dashboard/scraping/new">
              <Plus className="mr-2 h-4 w-4" />
              New Scraping Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Queue Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStatus?.running || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {queueStatus?.maxConcurrent || 3} max concurrent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStatus?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>
            Monitor the progress and status of your scraping jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedJobs.length === data?.jobs?.length && data?.jobs?.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.jobs?.map((job: any) => (
                    <TableRow 
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewJob(job.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedJobs.includes(job.id)}
                          onCheckedChange={(checked) => handleSelectJob(job.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <span>{job.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{job.targetWebsite}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">{job.successCount} success</div>
                          {job.errorCount > 0 && (
                            <div className="text-red-600">{job.errorCount} errors</div>
                          )}
                          <div className="text-muted-foreground">{job._count?.leads || 0} leads</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleViewJob(job.id);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {job._count?.leads > 0 && (
                              <DropdownMenuItem onClick={(e) => handleViewLeads(job.id, e)}>
                                View Leads
                              </DropdownMenuItem>
                            )}
                            {job.status === 'RUNNING' && (
                              <DropdownMenuItem 
                                onClick={(e) => handleCancelJob(job.id, e)}
                                className="text-red-600"
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Cancel Job
                              </DropdownMenuItem>
                            )}
                            {job.status === 'FAILED' && (
                              <DropdownMenuItem onClick={(e) => handleRetryJob(job.id, e)}>
                                <Play className="mr-2 h-4 w-4" />
                                Retry Job
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}{' '}
                of {data.pagination.total} jobs
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}