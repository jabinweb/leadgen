'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight,
  Search, 
  Mail, 
  TrendingUp,
  Zap,
  Users,
  BarChart,
  Database,
  Shield,
  Sparkles,
  CheckCircle2,
  Target,
  MessageSquare,
  Globe,
  Crown
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Search,
    title: 'Smart Lead Scraping',
    description: 'Extract qualified leads from Google Maps, Yelp, Instagram, and Facebook with AI-powered filters.',
  },
  {
    icon: Mail,
    title: 'AI Email Campaigns',
    description: 'Generate personalized cold emails with AI and track opens, clicks, and replies in real-time.',
  },
  {
    icon: TrendingUp,
    title: 'Lead Enrichment',
    description: 'Automatically enrich leads with company data, social profiles, and contact information.',
  },
  {
    icon: Target,
    title: 'Duplicate Detection',
    description: 'Intelligent duplicate detection and merging keeps your database clean and organized.',
  },
  {
    icon: BarChart,
    title: 'Advanced Analytics',
    description: 'Track performance with detailed reports on lead sources, campaign metrics, and ROI.',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Automate repetitive tasks and focus on what matters - closing deals.',
  },
];

const stats = [
  { value: '10,000+', label: 'Leads Generated' },
  { value: '95%', label: 'Email Delivery Rate' },
  { value: '4.5x', label: 'Average ROI' },
  { value: '24/7', label: 'Support Available' },
];

const benefits = [
  'No credit card required for free trial',
  '14-day money-back guarantee',
  'Cancel anytime',
  'Secure payment with Razorpay',
  'GDPR compliant',
  'Priority customer support',
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg dark:bg-slate-950/80">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              LeadGen Pro
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#benefits" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              Why Us
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button size="sm" className="text-xs sm:text-sm" asChild>
              <Link href="/pricing">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 sm:pt-20 md:pt-32 pb-12 sm:pb-16 md:pb-24 max-w-6xl">
        <div className="text-center space-y-6 sm:space-y-8">
          <Badge variant="secondary" className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 mr-1 inline" />
            AI-Powered Lead Generation Platform
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight !leading-[1.1em] px-4">
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
              Generate Leads.
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
              Close More Deals.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed px-4">
            The all-in-one platform for lead generation, enrichment, and outreach. 
            Scrape leads from multiple platforms, send AI-powered emails, and track every interaction.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 px-4">
            <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12" asChild>
              <Link href="/pricing">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12" asChild>
              <Link href="/pricing">
                <Crown className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                View Pricing
              </Link>
            </Button>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 px-4">
            Start with 20 free leads per month • No credit card required
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 sm:py-24 max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-3 sm:mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-4">
            Everything you need to scale
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
            Powerful tools designed to help you generate, manage, and convert leads faster than ever.
          </p>
        </div>
        
        <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardContent className="pt-5 sm:pt-6">
                <div className="rounded-lg bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-100 dark:bg-slate-900 py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-3 sm:mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-4">
              Simple 3-step process
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="rounded-full bg-primary text-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Scrape Leads</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Extract qualified leads from multiple platforms with smart filters
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-primary text-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Enrich & Organize</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Automatically enrich with company data and remove duplicates
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-primary text-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Send & Track</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Launch AI-powered email campaigns and track every interaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container mx-auto px-4 py-16 sm:py-24 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <Badge variant="secondary" className="mb-3 sm:mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
              Built for growth, designed for success
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-6 sm:mb-8">
              Join thousands of businesses using LeadGen Pro to streamline their lead generation 
              and close more deals every month.
            </p>
            
            <div className="space-y-2 sm:space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="border-2">
              <CardContent className="pt-4 sm:pt-6">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-semibold mb-1">Secure & Compliant</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  GDPR compliant with enterprise-grade security
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-4 sm:pt-6">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-semibold mb-1">Expert Support</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  24/7 priority support for all paid plans
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-4 sm:pt-6">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-semibold mb-1">Global Reach</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Scrape leads from anywhere in the world
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-4 sm:pt-6">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-semibold mb-1">AI-Powered</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Smart email generation with Gemini AI
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-primary to-blue-600 py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Ready to 10x your lead generation?
          </h2>
          <p className="text-base sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of businesses already using LeadGen Pro. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12" asChild>
              <Link href="/pricing">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 bg-white/10 text-white border-white/20 hover:bg-white/20" asChild>
              <Link href="/pricing">View All Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-base sm:text-lg font-bold">LeadGen Pro</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                The most powerful lead generation platform for modern businesses. 
                Generate, enrich, and convert leads at scale.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Product</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Pricing</Link></li>
                <li><Link href="/pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Plans</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="/auth/signin" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Sign In</Link></li>
                <li><Link href="/pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Get Started</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} LeadGen Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}