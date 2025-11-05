'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Sparkles, Zap, Crown, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const response = await fetch('/api/pricing/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/current');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const handleSelectPlan = async (planId: string, planName: string) => {
    // Check if user is authenticated
    if (!session) {
      toast.error('Please sign in to select a plan');
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }

    if (planName === 'free') {
      // Handle free plan activation
      setLoadingPlan(planId);
      try {
        const response = await fetch('/api/subscription/activate-free', {
          method: 'POST',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to activate free plan');
        }
        
        toast.success('Free plan activated!');
        router.push('/dashboard');
      } catch (error: any) {
        toast.error(error.message || 'Failed to activate plan');
      } finally {
        setLoadingPlan(null);
      }
      return;
    }

    // Handle paid plan - create Razorpay order
    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const { order, key } = await response.json();

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key,
          amount: order.amount,
          currency: order.currency,
          name: 'LeadGen SaaS',
          description: `Subscription to ${planName} plan`,
          order_id: order.id,
          handler: async function (response: any) {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              }),
            });

            if (verifyResponse.ok) {
              toast.success('Payment successful! Your subscription is now active.');
              router.push('/dashboard');
            } else {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            email: subscription?.user?.email || '',
            contact: '',
          },
          theme: {
            color: '#000000',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setLoadingPlan(null);
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate payment');
      setLoadingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return <Sparkles className="h-6 w-6" />;
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'professional':
        return <Crown className="h-6 w-6" />;
      case 'enterprise':
        return <Building2 className="h-6 w-6" />;
      default:
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial and upgrade as you grow. No credit card required for free plan.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans?.plans?.map((plan: any) => {
            const isCurrentPlan = subscription?.subscription?.planId === plan.id;
            const isPaidPlan = plan.price > 0;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${
                  plan.name === 'professional' 
                    ? 'border-primary shadow-lg scale-105' 
                    : ''
                }`}
              >
                {plan.name === 'professional' && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPlanIcon(plan.name)}
                      <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="min-h-12">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.name === 'professional' ? 'default' : 'outline'}
                    disabled={isCurrentPlan || loadingPlan === plan.id}
                    onClick={() => handleSelectPlan(plan.id, plan.name)}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : !session ? (
                      'Sign In to Continue'
                    ) : plan.price === 0 ? (
                      'Start Free Trial'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {!session && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Already have an account?
            </p>
            <Button variant="outline" asChild>
              <Link href="/auth/signin?callbackUrl=/pricing">
                Sign In
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include 14-day money-back guarantee
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
