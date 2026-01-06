'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface AssignMemberSelectProps {
  currentAssigneeId?: string | null;
  resourceType: 'lead' | 'deal' | 'task';
  resourceId: string;
  onAssignmentChange?: (assigneeId: string | null) => void;
  size?: 'sm' | 'default' | 'lg';
}

export function AssignMemberSelect({
  currentAssigneeId,
  resourceType,
  resourceId,
  onAssignmentChange,
  size = 'default',
}: AssignMemberSelectProps) {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string>(
    currentAssigneeId || 'unassigned'
  );

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleAssign = async (memberId: string) => {
    setLoading(true);
    try {
      const assignToId = memberId === 'unassigned' ? null : memberId;
      
      const response = await fetch(
        `/api/${resourceType}s/${resourceId}/assign`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedToId: assignToId }),
        }
      );

      if (response.ok) {
        setAssignedTo(memberId);
        onAssignmentChange?.(assignToId);
        
        const assignedMember = teamMembers.find((m) => m.id === memberId);
        toast({
          title: 'Success',
          description: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} ${
            memberId === 'unassigned'
              ? 'unassigned'
              : `assigned to ${assignedMember?.name || assignedMember?.email}`
          }`,
        });
      } else {
        throw new Error('Assignment failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to assign ${resourceType}`,
        variant: 'destructive',
      });
      setAssignedTo(currentAssigneeId || 'unassigned');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={assignedTo} onValueChange={handleAssign} disabled={loading}>
      <SelectTrigger className={size === 'sm' ? 'h-8 text-xs' : ''}>
        <SelectValue placeholder="Assign to...">
          {assignedTo === 'unassigned' ? (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Unassigned</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {(() => {
                const member = teamMembers.find((m) => m.id === assignedTo);
                return (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member?.image || ''} />
                      <AvatarFallback className="text-xs">
                        {member?.name?.[0] || member?.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member?.name || member?.email}</span>
                  </>
                );
              })()}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>Unassigned</span>
          </div>
        </SelectItem>
        {teamMembers.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={member.image || ''} />
                <AvatarFallback className="text-xs">
                  {member.name?.[0] || member.email[0]}
                </AvatarFallback>
              </Avatar>
              <span>{member.name || member.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
