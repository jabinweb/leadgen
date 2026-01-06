'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock } from 'lucide-react';

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  dealId?: string;
  leadName?: string;
  dealName?: string;
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  { value: 'MEETING', label: 'Meeting' },
  { value: 'CALL', label: 'Call' },
  { value: 'DEMO', label: 'Demo' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSING', label: 'Closing' },
];

export function QuickScheduleDialog({
  open,
  onOpenChange,
  leadId,
  dealId,
  leadName,
  dealName,
  onSuccess,
}: QuickScheduleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    eventType: 'MEETING',
    startTime: '',
    endTime: '',
    meetingLink: '',
    attendees: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          leadId,
          dealId,
          attendees: formData.attendees
            ? formData.attendees.split(',').map((e) => e.trim())
            : undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Meeting scheduled successfully',
        });
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        throw new Error('Failed to schedule meeting');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      eventType: 'MEETING',
      startTime: '',
      endTime: '',
      meetingLink: '',
      attendees: '',
    });
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);

    setFormData({
      ...formData,
      startTime: tomorrow.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
    });
  };

  const handleSetNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    const endTime = new Date(nextWeek);
    endTime.setHours(11, 0, 0, 0);

    setFormData({
      ...formData,
      startTime: nextWeek.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            {leadName && `Schedule a meeting with ${leadName}`}
            {dealName && `Schedule a meeting for ${dealName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quick-title">Title *</Label>
            <Input
              id="quick-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={`Meeting with ${leadName || dealName || 'client'}`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-type">Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetTomorrow}
              >
                Tomorrow 10AM
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetNextWeek}
              >
                Next Week
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-start">Start Time *</Label>
              <Input
                id="quick-start"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="quick-end">End Time *</Label>
              <Input
                id="quick-end"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quick-description">Description</Label>
            <Textarea
              id="quick-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Meeting agenda..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-location">Location</Label>
              <Input
                id="quick-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office, Zoom, etc."
              />
            </div>

            <div>
              <Label htmlFor="quick-link">Meeting Link</Label>
              <Input
                id="quick-link"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quick-attendees">Attendees (optional)</Label>
            <Input
              id="quick-attendees"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
