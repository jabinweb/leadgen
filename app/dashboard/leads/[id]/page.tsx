'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Globe,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Linkedin,
  User,
  Briefcase,
  FileText,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lead details');
      }
      return response.json();
    },
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}/activities`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      return response.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Note added successfully');
      setNote('');
      setIsAddingNote(false);
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
    onError: () => {
      toast.error('Failed to add note');
    },
  });

  const handleAddNote = () => {
    if (!note.trim()) {
      toast.error('Please enter a note');
      return;
    }
    addNoteMutation.mutate(note);
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

  if (!lead) {
    return (
      <div className="flex-1 space-y-4">
        <div className="text-center py-8">
          <p className="text-red-500">Lead not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
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
            <Link href="/dashboard/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{lead.companyName}</h2>
            <p className="text-muted-foreground">Lead Details</p>
          </div>
        </div>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company Name</p>
              <p className="text-lg font-semibold">{lead.companyName}</p>
            </div>
            
            {lead.industry && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <Badge variant="outline">{lead.industry}</Badge>
              </div>
            )}

            {lead.employeeCount && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                <p className="text-lg">{lead.employeeCount} employees</p>
              </div>
            )}

            {lead.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{lead.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.contactName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                <p className="text-lg">{lead.contactName}</p>
              </div>
            )}

            {lead.jobTitle && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.jobTitle}</span>
                </div>
              </div>
            )}

            {lead.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  <span>{lead.email}</span>
                </a>
              </div>
            )}

            {lead.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  <span>{lead.phone}</span>
                </a>
              </div>
            )}

            {lead.website && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                <a 
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span>{lead.website}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {lead.linkedinUrl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                <a 
                  href={lead.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>View Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        {lead.address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{lead.address}</p>
            </CardContent>
          </Card>
        )}

        {/* Source & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Source & Metadata</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Source</p>
              <Badge variant="secondary">{lead.source}</Badge>
            </div>

            {lead.sourceUrl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Source URL</p>
                <a 
                  href={lead.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span className="truncate max-w-[200px]">{lead.sourceUrl}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Added</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{format(new Date(lead.createdAt), 'PPpp')}</span>
              </div>
            </div>

            {lead.scrapingJob && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scraping Job</p>
                <Link 
                  href={`/dashboard/scraping/${lead.scrapingJobId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {lead.scrapingJob.name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Activity Timeline</span>
              </CardTitle>
              <CardDescription>
                Track all interactions and changes with this lead
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={() => setIsAddingNote(!isAddingNote)}
              variant={isAddingNote ? "secondary" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAddingNote ? 'Cancel' : 'Add Note'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingNote && (
            <div className="mb-6 space-y-2">
              <Textarea
                placeholder="Add a note about this lead..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleAddNote}
                disabled={addNoteMutation.isPending}
                size="sm"
              >
                {addNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          )}
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity: any) => (
                <div key={activity.id} className="flex space-x-4 border-l-2 border-muted pl-4 pb-4 last:pb-0">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {activity.activityType === 'CREATED' && '🆕 Lead Created'}
                        {activity.activityType === 'STATUS_CHANGED' && '🔄 Status Changed'}
                        {activity.activityType === 'EMAIL_SENT' && '📧 Email Sent'}
                        {activity.activityType === 'EMAIL_OPENED' && '👁️ Email Opened'}
                        {activity.activityType === 'EMAIL_CLICKED' && '🖱️ Email Clicked'}
                        {activity.activityType === 'EMAIL_REPLIED' && '💬 Email Replied'}
                        {activity.activityType === 'NOTE_ADDED' && '📝 Note Added'}
                        {activity.activityType === 'TAG_ADDED' && '🏷️ Tag Added'}
                        {activity.activityType === 'ENRICHED' && '✨ Lead Enriched'}
                        {activity.activityType === 'CONTACTED' && '📞 Contacted'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), 'PPp')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.metadata && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
                        {activity.activityType === 'STATUS_CHANGED' && (
                          <span>
                            {activity.metadata.oldStatus} → {activity.metadata.newStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No activities yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
