'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  FileText, 
  Settings, 
  Users, 
  BarChart3, 
  Search,
  Download,
  PlayCircle,
  Mail,
  ChevronDown,
  ChevronRight,
  Send,
  Copy,
  CreditCard,
  FlaskConical,
  List,
  MailOpen,
  Star,
  Trash2,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/dashboard/calendar', icon: BarChart3 },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Duplicates', href: '/dashboard/duplicates', icon: Copy },
  { 
    name: 'Emails', 
    href: '/dashboard/emails', 
    icon: Mail,
    children: [
      { name: 'Sent', href: '/dashboard/emails?folder=sent', icon: Send },
      { name: 'Drafts', href: '/dashboard/emails?folder=drafts', icon: FileText },
      { name: 'Starred', href: '/dashboard/emails?folder=starred', icon: Star },
      { name: 'Trash', href: '/dashboard/emails?folder=trash', icon: Trash2 },
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: MailOpen },
      { name: 'Email Log', href: '/dashboard/emails/log', icon: List },
      { name: 'Email Tester', href: '/dashboard/emails/test', icon: FlaskConical },
      { name: 'Email Settings', href: '/dashboard/emails/settings', icon: Settings },
    ]
  },
  { name: 'Sequences', href: '/dashboard/sequences', icon: Send },
  { name: 'Tasks', href: '/dashboard/tasks', icon: List },
  { name: 'Deals', href: '/dashboard/deals', icon: CreditCard },
  { name: 'Email Templates', href: '/dashboard/email-templates', icon: FileText },
  { name: 'Scraping Jobs', href: '/dashboard/scraping', icon: Search },
  { name: 'New Scraping Job', href: '/dashboard/scraping/new', icon: PlayCircle },
  // { name: 'Export', href: '/dashboard/export', icon: Download },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Documentation', href: '/dashboard/docs', icon: BookOpen },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    children: [
      { name: 'General', href: '/dashboard/settings', icon: Settings },
      { name: 'Subscription', href: '/dashboard/settings/subscription', icon: CreditCard },
    ]
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Emails']);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActive = (href: string) => {
    // Split href into path and query
    const [hrefPath, hrefQuery] = href.split('?');
    
    // Check if pathname matches
    if (pathname !== hrefPath) {
      return false;
    }
    
    // If no query in href, just check pathname
    if (!hrefQuery) {
      return pathname === hrefPath;
    }
    
    // Parse query params from href
    const hrefParams = new URLSearchParams(hrefQuery);
    
    // Check if all href params match current params
    const hrefParamsArray = Array.from(hrefParams.entries());
    for (let i = 0; i < hrefParamsArray.length; i++) {
      const [key, value] = hrefParamsArray[i];
      if (searchParams.get(key) !== value) {
        return false;
      }
    }
    
    return true;
  };
  
  const isParentActive = (item: NavigationItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.href) || pathname.startsWith(child.href.split('?')[0] + '/'));
    }
    return false;
  };

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Lead Generation
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <Button
                      variant={isParentActive(item) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-between",
                        isParentActive(item) && "bg-muted font-medium"
                      )}
                      onClick={() => toggleMenu(item.name)}
                    >
                      <div className="flex items-center">
                        <item.icon className={cn(
                          "mr-2 h-4 w-4",
                          isParentActive(item) && "text-blue-600"
                        )} />
                        {item.name}
                      </div>
                      {expandedMenus.includes(item.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedMenus.includes(item.name) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Button
                            key={child.name}
                            variant={isActive(child.href) ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start text-sm",
                              isActive(child.href) && "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500"
                            )}
                            asChild
                            onClick={onNavigate}
                          >
                            <Link href={child.href}>
                              <child.icon className={cn(
                                "mr-2 h-3 w-3",
                                isActive(child.href) && "text-blue-600"
                              )} />
                              {child.name}
                            </Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive(item.href) && "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500"
                    )}
                    asChild
                    onClick={onNavigate}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn(
                        "mr-2 h-4 w-4",
                        isActive(item.href) && "text-blue-600"
                      )} />
                      {item.name}
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}