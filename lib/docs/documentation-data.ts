// Documentation content structure
// This allows easy content management separate from UI

export interface DocSection {
  id: string;
  title: string;
  description?: string;
  content: DocContent[];
  category: 'getting-started' | 'features' | 'workflows' | 'best-practices' | 'api';
}

export interface DocContent {
  type: 'text' | 'list' | 'steps' | 'grid' | 'table' | 'code' | 'alert';
  data: any;
}

export const documentationData: DocSection[] = [
  // Getting Started
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    description: 'Get up and running in 5 minutes',
    category: 'getting-started',
    content: [
      {
        type: 'steps',
        data: [
          {
            number: 1,
            title: 'Complete Your Profile',
            description: 'Set up your profile, company details, and currency preferences in Settings',
            icon: 'Settings',
          },
          {
            number: 2,
            title: 'Add Your First Lead',
            description: 'Manually add leads or import from CSV. You can also use web scraping for bulk collection',
            icon: 'Users',
          },
          {
            number: 3,
            title: 'Set Up Email Templates',
            description: 'Create reusable email templates or use our 20 pre-built templates',
            icon: 'Mail',
          },
          {
            number: 4,
            title: 'Create Email Sequences',
            description: 'Automate your outreach with multi-step email sequences (5 default sequences available)',
            icon: 'Zap',
          },
          {
            number: 5,
            title: 'Start Converting',
            description: 'Enroll leads in sequences, track engagement, and move hot leads to your pipeline',
            icon: 'TrendingUp',
          },
        ],
      },
      {
        type: 'alert',
        data: {
          variant: 'info',
          title: 'Pro Tip',
          message: 'Set your preferred currency in Settings first. This ensures all deal values and revenue metrics display in your local currency throughout the platform.',
        },
      },
    ],
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    category: 'getting-started',
    content: [
      {
        type: 'text',
        data: 'Your dashboard provides real-time insights into your sales performance:',
      },
      {
        type: 'grid',
        data: [
          {
            title: 'Lead Score Distribution',
            description: 'Visual breakdown of lead quality (Hot: 61-100, Warm: 31-60, Cold: 0-30)',
            icon: 'BarChart3',
            color: 'blue',
          },
          {
            title: 'Pipeline Value',
            description: 'Total value of all deals in progress, displayed in your preferred currency',
            icon: 'TrendingUp',
            color: 'green',
          },
          {
            title: 'Conversion Metrics',
            description: 'Win rates, average deal size, and sales cycle length',
            icon: 'Target',
            color: 'purple',
          },
          {
            title: 'Upcoming Events',
            description: 'Calendar view of scheduled meetings, demos, and follow-ups',
            icon: 'Calendar',
            color: 'orange',
          },
        ],
      },
    ],
  },

  // Features
  {
    id: 'lead-management',
    title: 'Lead Management',
    category: 'features',
    content: [
      {
        type: 'list',
        data: {
          title: 'Key Features',
          items: [
            'Manual entry and CSV import',
            'Automated lead scoring (0-100)',
            'Custom fields and tagging',
            'Duplicate detection',
            'Bulk actions and filters',
            'Activity timeline tracking',
          ],
        },
      },
    ],
  },
  {
    id: 'email-campaigns',
    title: 'Email Campaigns',
    category: 'features',
    content: [
      {
        type: 'text',
        data: 'One-time bulk email blasts for announcements and newsletters',
      },
      {
        type: 'list',
        data: {
          title: 'Campaign Features',
          items: [
            'One-time bulk email sends',
            'Template library (20+ templates)',
            'Recipient filtering and segmentation',
            'Real-time delivery tracking',
            'Open and click rate analytics',
            'Schedule or send immediately',
          ],
        },
      },
      {
        type: 'alert',
        data: {
          variant: 'success',
          title: 'When to Use Campaigns',
          message: 'Product launches, newsletters, event invitations, company updates',
        },
      },
    ],
  },
  {
    id: 'email-sequences',
    title: 'Email Sequences',
    category: 'features',
    content: [
      {
        type: 'text',
        data: 'Automated multi-step drip campaigns with intelligent follow-ups',
      },
      {
        type: 'list',
        data: {
          title: 'Sequence Features',
          items: [
            'Multi-step automated follow-ups',
            'Time-based delays (days/hours)',
            'Conditional logic (if no reply, if opened)',
            'Personalization variables',
            '5 pre-built sequences included',
            'Individual enrollment tracking',
          ],
        },
      },
      {
        type: 'alert',
        data: {
          variant: 'success',
          title: 'When to Use Sequences',
          message: 'Welcome series, demo follow-ups, trial nurturing, re-engagement campaigns',
        },
      },
    ],
  },
  {
    id: 'deals-pipeline',
    title: 'Deals & Pipeline',
    category: 'features',
    content: [
      {
        type: 'list',
        data: {
          title: 'Pipeline Features',
          items: [
            'Visual pipeline management',
            'Multi-currency support (14 currencies)',
            'Probability-weighted forecasting',
            'Stage-based workflows',
            'Deal activity logging',
            'Revenue analytics by team member',
          ],
        },
      },
      {
        type: 'table',
        data: {
          title: 'Deal Stages',
          headers: ['Stage', 'Description'],
          rows: [
            ['New', 'Initial opportunity identified'],
            ['Qualified', 'Needs and budget confirmed'],
            ['Proposal', 'Quote/proposal sent'],
            ['Negotiation', 'Terms being discussed'],
            ['Won', 'Deal closed successfully ✅'],
            ['Lost', 'Opportunity lost ❌'],
          ],
        },
      },
    ],
  },

  // Workflows
  {
    id: 'new-lead-workflow',
    title: 'New Lead Workflow',
    category: 'workflows',
    content: [
      {
        type: 'steps',
        data: [
          {
            number: 1,
            title: 'Lead Capture',
            description: 'Lead captured (manual entry, CSV import, or web scraping)',
          },
          {
            number: 2,
            title: 'Auto-Score',
            description: 'System automatically scores lead (0-100 based on profile data)',
          },
          {
            number: 3,
            title: 'Enroll in Sequence',
            description: 'Enroll in "Welcome & Introduction" sequence',
          },
          {
            number: 4,
            title: 'Monitor Engagement',
            description: 'Track email engagement (opens, clicks, replies)',
          },
          {
            number: 5,
            title: 'Take Action',
            description: 'Hot leads (61-100): Create deal & schedule demo. Warm (31-60): Continue nurturing. Cold (0-30): Re-engage quarterly',
          },
        ],
      },
    ],
  },
  {
    id: 'deal-closing-workflow',
    title: 'Deal Closing Workflow',
    category: 'workflows',
    content: [
      {
        type: 'steps',
        data: [
          { number: 1, title: 'Create Deal', description: 'Qualified lead → Create new deal in pipeline' },
          { number: 2, title: 'Schedule Call', description: 'Schedule discovery call or demo via Calendar' },
          { number: 3, title: 'Send Proposal', description: 'Send proposal using email template' },
          { number: 4, title: 'Follow Up', description: 'Enroll in "Demo Follow-up" sequence' },
          { number: 5, title: 'Move Through Pipeline', description: 'Progress: Qualified → Proposal → Negotiation' },
          { number: 6, title: 'Update Probability', description: 'Adjust close probability as deal progresses' },
          { number: 7, title: 'Close Deal', description: 'Mark as Won/Lost when finalized' },
          { number: 8, title: 'Post-Close', description: 'If Won: Onboarding. If Lost: Re-engagement list' },
        ],
      },
    ],
  },

  // Best Practices
  {
    id: 'lead-best-practices',
    title: 'Lead Management Best Practices',
    category: 'best-practices',
    content: [
      {
        type: 'list',
        data: {
          title: 'Do',
          variant: 'success',
          items: [
            'Score leads regularly based on engagement and profile completeness',
            'Use duplicate detection tool monthly to clean database',
            'Add detailed notes after every interaction',
            'Tag leads consistently (industry, company size, region)',
            'Set follow-up reminders for inactive leads',
          ],
        },
      },
      {
        type: 'list',
        data: {
          title: "Don't",
          variant: 'danger',
          items: [
            "Don't let leads sit idle without follow-up reminders",
            "Don't mass-delete leads without reviewing notes first",
            "Don't skip lead scoring - it impacts prioritization",
          ],
        },
      },
    ],
  },
  {
    id: 'email-best-practices',
    title: 'Email Strategy Best Practices',
    category: 'best-practices',
    content: [
      {
        type: 'list',
        data: {
          title: 'Do',
          variant: 'success',
          items: [
            'Use campaigns for one-time announcements (launches, events)',
            'Use sequences for nurturing and multi-touch outreach',
            'Personalize with variables and reference specific details',
            'A/B test subject lines to improve open rates',
            'Monitor metrics and adjust strategy accordingly',
          ],
        },
      },
      {
        type: 'list',
        data: {
          title: "Don't",
          variant: 'danger',
          items: [
            "Don't send more than 1 email per day per lead",
            "Don't ignore unsubscribe requests",
            "Don't use generic, impersonal messaging",
          ],
        },
      },
    ],
  },

  // API
  {
    id: 'api-endpoints',
    title: 'API Endpoints',
    category: 'api',
    content: [
      {
        type: 'table',
        data: {
          title: 'Leads API',
          headers: ['Method', 'Endpoint', 'Description'],
          rows: [
            ['GET', '/api/leads', 'Fetch all leads with pagination'],
            ['POST', '/api/leads', 'Create new lead'],
            ['PATCH', '/api/leads/:id', 'Update lead details'],
            ['DELETE', '/api/leads/:id', 'Delete lead'],
            ['POST', '/api/leads/import', 'Bulk import from CSV'],
          ],
        },
      },
      {
        type: 'table',
        data: {
          title: 'Sequences API',
          headers: ['Method', 'Endpoint', 'Description'],
          rows: [
            ['GET', '/api/sequences', 'Get user sequences'],
            ['POST', '/api/sequences', 'Create new sequence'],
            ['PATCH', '/api/sequences/:id', 'Update sequence'],
            ['POST', '/api/sequences/:id/enroll', 'Enroll leads'],
            ['DELETE', '/api/sequences/:id', 'Delete sequence'],
          ],
        },
      },
      {
        type: 'alert',
        data: {
          variant: 'info',
          title: 'Authentication Required',
          message: 'All API endpoints require authentication via NextAuth session. API calls must include valid session cookies.',
        },
      },
    ],
  },
];

// Helper function to search documentation
export function searchDocs(query: string): DocSection[] {
  if (!query.trim()) return [];
  
  const lowercaseQuery = query.toLowerCase();
  
  return documentationData.filter(section => {
    // Search in title
    if (section.title.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Search in description
    if (section.description?.toLowerCase().includes(lowercaseQuery)) return true;
    
    // Search in content
    return section.content.some(content => {
      const contentStr = JSON.stringify(content.data).toLowerCase();
      return contentStr.includes(lowercaseQuery);
    });
  });
}

// Helper to get sections by category
export function getSectionsByCategory(category: DocSection['category']): DocSection[] {
  return documentationData.filter(section => section.category === category);
}

// Helper to get section by ID
export function getSectionById(id: string): DocSection | undefined {
  return documentationData.find(section => section.id === id);
}
