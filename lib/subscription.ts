import { prisma } from '@/lib/prisma';

export interface UsageLimits {
  canCreateLead: boolean;
  canSendEmail: boolean;
  canCreateCampaign: boolean;
  leadsRemaining: number;
  emailsRemaining: number;
  campaignsRemaining: number;
  currentUsage: {
    leadsCreated: number;
    emailsSent: number;
    campaignsCreated: number;
  };
  limits: {
    maxLeads: number;
    maxEmails: number;
    maxCampaigns: number;
  };
}

export async function checkUsageLimits(userId: string): Promise<UsageLimits> {
  // Get user's subscription and usage
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  const usage = await prisma.usageTracking.findUnique({
    where: { userId },
  });

  // If no subscription, return very limited access
  if (!subscription) {
    return {
      canCreateLead: false,
      canSendEmail: false,
      canCreateCampaign: false,
      leadsRemaining: 0,
      emailsRemaining: 0,
      campaignsRemaining: 0,
      currentUsage: {
        leadsCreated: usage?.leadsCreated || 0,
        emailsSent: usage?.emailsSent || 0,
        campaignsCreated: usage?.campaignsCreated || 0,
      },
      limits: {
        maxLeads: 0,
        maxEmails: 0,
        maxCampaigns: 0,
      },
    };
  }

  const { plan } = subscription;
  const currentUsage = {
    leadsCreated: usage?.leadsCreated || 0,
    emailsSent: usage?.emailsSent || 0,
    campaignsCreated: usage?.campaignsCreated || 0,
  };

  // Check if subscription is expired
  const isExpired = new Date() > new Date(subscription.currentPeriodEnd);
  if (isExpired && subscription.status !== 'TRIALING') {
    return {
      canCreateLead: false,
      canSendEmail: false,
      canCreateCampaign: false,
      leadsRemaining: 0,
      emailsRemaining: 0,
      campaignsRemaining: 0,
      currentUsage,
      limits: {
        maxLeads: plan.maxLeads,
        maxEmails: plan.maxEmails,
        maxCampaigns: plan.maxCampaigns,
      },
    };
  }

  // Unlimited plan (-1 means unlimited)
  const isUnlimited = (limit: number) => limit === -1;

  const canCreateLead = isUnlimited(plan.maxLeads) || currentUsage.leadsCreated < plan.maxLeads;
  const canSendEmail = isUnlimited(plan.maxEmails) || currentUsage.emailsSent < plan.maxEmails;
  const canCreateCampaign = isUnlimited(plan.maxCampaigns) || currentUsage.campaignsCreated < plan.maxCampaigns;

  return {
    canCreateLead,
    canSendEmail,
    canCreateCampaign,
    leadsRemaining: isUnlimited(plan.maxLeads) ? -1 : Math.max(0, plan.maxLeads - currentUsage.leadsCreated),
    emailsRemaining: isUnlimited(plan.maxEmails) ? -1 : Math.max(0, plan.maxEmails - currentUsage.emailsSent),
    campaignsRemaining: isUnlimited(plan.maxCampaigns) ? -1 : Math.max(0, plan.maxCampaigns - currentUsage.campaignsCreated),
    currentUsage,
    limits: {
      maxLeads: plan.maxLeads,
      maxEmails: plan.maxEmails,
      maxCampaigns: plan.maxCampaigns,
    },
  };
}

export async function incrementUsage(
  userId: string,
  type: 'leads' | 'emails' | 'campaigns',
  amount: number = 1
): Promise<void> {
  const fieldMap = {
    leads: 'leadsCreated',
    emails: 'emailsSent',
    campaigns: 'campaignsCreated',
  };

  await prisma.usageTracking.upsert({
    where: { userId },
    create: {
      userId,
      [fieldMap[type]]: amount,
    },
    update: {
      [fieldMap[type]]: {
        increment: amount,
      },
    },
  });
}

export async function resetMonthlyUsage(userId: string): Promise<void> {
  await prisma.usageTracking.update({
    where: { userId },
    data: {
      leadsCreated: 0,
      emailsSent: 0,
      campaignsCreated: 0,
      lastResetAt: new Date(),
    },
  });
}
