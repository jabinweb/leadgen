'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { UsageBanner } from '@/components/subscription/usage-banner';
import { EmailReplyChecker } from '@/components/email/email-reply-checker';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <EmailReplyChecker />
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild className="lg:hidden fixed bottom-4 left-4 z-50">
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block sticky top-0 h-full overflow-y-auto border-r">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <UsageBanner />
          {children}
        </main>
      </div>
    </div>
  );
}