'use client';

import { Badge } from '@/components/ui/badge';
import { Flame, Snowflake, Wind } from 'lucide-react';

interface LeadScoreBadgeProps {
  score: number;
  showNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadScoreBadge({ score, showNumber = true, size = 'md' }: LeadScoreBadgeProps) {
  const getScoreCategory = () => {
    if (score >= 70) return { label: 'Hot', color: 'bg-red-500', icon: Flame };
    if (score >= 40) return { label: 'Warm', color: 'bg-orange-500', icon: Wind };
    return { label: 'Cold', color: 'bg-blue-500', icon: Snowflake };
  };

  const { label, color, icon: Icon } = getScoreCategory();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge className={`${color} text-white ${sizeClasses[size]} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
      {showNumber && <span className="ml-1 font-semibold">({score})</span>}
    </Badge>
  );
}
