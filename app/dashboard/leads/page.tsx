'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  Search, 
  Filter, 
  ExternalLink,
  Mail,
  Phone,
  Building,
  MapPin,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { EmailDraftModal } from '@/components/email/email-draft-modal';

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrapingJobId = searchParams.get('scrapingJobId');
  
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDrafts, setEmailDrafts] = useState<any[]>([]);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', { search, industry, status, page, limit, scrapingJobId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(industry && industry !== 'all' && { industry }),
        ...(status && status !== 'all' && { status }),
        ...(scrapingJobId && { scrapingJobId }),
      });

      const response = await fetch(`/api/leads?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      return response.json();
    },
  });

  const handleExport = async (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      format,
      ...(search && { search }),
      ...(industry && industry !== 'all' && { industry }),
      ...(scrapingJobId && { scrapingJobId }),
    });

    const response = await fetch(`/api/leads/export?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `leads.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allLeadIds = data?.leads?.map((lead: any) => lead.id) || [];
      setSelectedLeads(allLeadIds);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleBulkExport = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to export');
      return;
    }
    toast.success(`Exporting ${selectedLeads.length} leads...`);
    // TODO: Implement bulk export with selected IDs
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
      toast.success(`Deleted ${selectedLeads.length} leads`);
      setSelectedLeads([]);
      // TODO: Implement bulk delete
    }
  };

  const handleContactLead = async (leadId: string) => {
    setIsGeneratingEmail(true);
    toast.loading('Generating personalized email with AI...', { id: 'generating-email' });
    try {
      const response = await fetch('/api/leads/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [leadId] }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      toast.success('Email generated successfully!', { id: 'generating-email' });
      setEmailDrafts(data.drafts);
      setShowEmailModal(true);
    } catch (error) {
      toast.error('Failed to generate email draft', { id: 'generating-email' });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleBulkContact = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to contact');
      return;
    }
    
    setIsGeneratingEmail(true);
    toast.loading(`Generating ${selectedLeads.length} personalized emails with AI...`, { id: 'generating-emails' });
    try {
      const response = await fetch('/api/leads/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeads }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate emails');
      }

      const data = await response.json();
      toast.success(`${data.drafts.length} emails generated successfully!`, { id: 'generating-emails' });
      setEmailDrafts(data.drafts);
      setShowEmailModal(true);
    } catch (error) {
      toast.error('Failed to generate email drafts', { id: 'generating-emails' });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Lead status updated to ${newStatus}`);
      // Refetch leads data without page reload
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      toast.error('Failed to update lead status');
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
        <div className="flex items-center space-x-2">
          {selectedLeads.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedLeads.length} selected
              </span>
              <Button 
                variant="default" 
                onClick={handleBulkContact}
                disabled={isGeneratingEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isGeneratingEmail ? 'Generating...' : 'Contact Selected'}
              </Button>
              <Button variant="outline" onClick={handleBulkExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>
            Search, filter, and manage your collected leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">🆕 New</SelectItem>
                <SelectItem value="CONTACTED">📧 Contacted</SelectItem>
                <SelectItem value="RESPONDED">💬 Responded</SelectItem>
                <SelectItem value="QUALIFIED">✅ Qualified</SelectItem>
                <SelectItem value="CONVERTED">🎉 Converted</SelectItem>
                <SelectItem value="LOST">❌ Lost</SelectItem>
                <SelectItem value="UNSUBSCRIBED">🚫 Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading leads
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedLeads.length === data?.leads?.length && data?.leads?.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Company</TableHead>
                    {/* <TableHead>Industry</TableHead> */}
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.leads?.map((lead: any) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{lead.companyName}</p>
                            {lead.rating && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                ⭐ {lead.rating}
                                {lead.reviewCount && (
                                  <span className="text-muted-foreground">({lead.reviewCount})</span>
                                )}
                              </span>
                            )}
                          </div>
                          {lead.address && (
                            <p className="text-xs text-muted-foreground flex items-center truncate">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{lead.address}</span>
                            </p>
                          )}
                          {lead.website && (
                            <Link 
                              href={lead.website} 
                              target="_blank"
                              className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Website
                            </Link>
                          )}
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        {lead.industry && (
                          <Badge variant="outline">{lead.industry}</Badge>
                        )}
                      </TableCell> */}
                      <TableCell>
                        <div className="space-y-1">
                          {lead.email && (
                            <a 
                              href={`mailto:${lead.email}`}
                              className="flex items-center text-xs text-blue-600 hover:underline"
                            >
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                          )}
                          {lead.phone && (
                            <a 
                              href={`tel:${lead.phone}`}
                              className="flex items-center text-xs text-blue-600 hover:underline"
                            >
                              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{lead.phone}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            lead.status === 'CONVERTED' ? 'default' :
                            lead.status === 'QUALIFIED' ? 'default' :
                            lead.status === 'RESPONDED' ? 'secondary' :
                            lead.status === 'CONTACTED' ? 'secondary' :
                            lead.status === 'LOST' ? 'destructive' :
                            lead.status === 'UNSUBSCRIBED' ? 'destructive' :
                            'outline'
                          }
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => handleContactLead(lead.id)}
                              disabled={isGeneratingEmail}
                            >
                              ✉️ {isGeneratingEmail ? 'Generating...' : 'Contact Lead'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
                              👁️ View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'NEW')}>
                              🆕 New
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'CONTACTED')}>
                              📧 Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'RESPONDED')}>
                              💬 Responded
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'QUALIFIED')}>
                              ✅ Qualified
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'CONVERTED')}>
                              🎉 Converted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'LOST')}>
                              ❌ Lost
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'UNSUBSCRIBED')}>
                              🚫 Unsubscribed
                            </DropdownMenuItem>
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
                of {data.pagination.total} leads
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
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

      {/* Email Draft Modal */}
      <EmailDraftModal
        open={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailDrafts([]);
        }}
        drafts={emailDrafts}
      />
    </div>
  );
}