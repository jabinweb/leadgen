'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Background email reply checker
 * Polls the check-replies endpoint every 30 seconds when user is active
 */
export function EmailReplyChecker() {
  const { data: session } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!session?.user) return;

    const checkReplies = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) return;
      
      try {
        isCheckingRef.current = true;
        
        const response = await fetch('/api/emails/check-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daysBack: 1 }), // Only check last 24 hours
        });

        if (response.ok) {
          const result = await response.json();
          if (result.processed > 0) {
            console.log(`✅ Processed ${result.processed} email replies`);
          }
        }
      } catch (error) {
        console.error('Error checking replies:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Check immediately on mount
    checkReplies();

    // Then check every 30 seconds
    intervalRef.current = setInterval(checkReplies, 30000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session]);

  // This component doesn't render anything
  return null;
}
