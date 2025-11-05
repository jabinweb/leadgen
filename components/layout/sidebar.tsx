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
  List
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Duplicates', href: '/dashboard/duplicates', icon: Copy },
  { 
    name: 'Emails', 
    href: '/dashboard/emails', 
    icon: Mail,
    children: [
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: Send },
      { name: 'Drafts', href: '/dashboard/emails/drafts', icon: FileText },
      { name: 'Email Log', href: '/dashboard/emails/log', icon: List },
      { name: 'Email Tester', href: '/dashboard/emails/test', icon: FlaskConical },
    ]
  },
  { name: 'Scraping Jobs', href: '/dashboard/scraping', icon: Search },
  { name: 'New Scraping Job', href: '/dashboard/scraping/new', icon: PlayCircle },
  // { name: 'Export', href: '/dashboard/export', icon: Download },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    children: [
      { name: 'Subscription', href: '/dashboard/settings/subscription', icon: CreditCard },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Emails']);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavigationItem) => {
    if (item.children) {
      return item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'));
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
                        isParentActive(item) && "bg-muted"
                      )}
                      onClick={() => toggleMenu(item.name)}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
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
                              isActive(child.href) && "bg-muted"
                            )}
                            asChild
                          >
                            <Link href={child.href}>
                              <child.icon className="mr-2 h-3 w-3" />
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
                      isActive(item.href) && "bg-muted"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
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