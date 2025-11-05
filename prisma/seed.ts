const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with subscription plans...');

  // Create Free Plan
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Free',
      description: 'Perfect for trying out our platform',
      price: 0,
      currency: 'INR',
      interval: 'month',
      maxLeads: 20,
      maxEmails: 50,
      maxCampaigns: 2,
      features: [
        '20 leads per month',
        '50 emails per month',
        '2 active campaigns',
        'Basic lead scraping',
        'Email templates',
        'Basic analytics',
      ],
      isActive: true,
    },
  });

  // Create Starter Plan
  const starterPlan = await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter',
      displayName: 'Starter',
      description: 'Great for small businesses and startups',
      price: 99900, // ₹999 in paise
      currency: 'INR',
      interval: 'month',
      maxLeads: 500,
      maxEmails: 2000,
      maxCampaigns: 10,
      features: [
        '500 leads per month',
        '2,000 emails per month',
        '10 active campaigns',
        'Advanced lead scraping',
        'Email templates',
        'AI email generation',
        'Lead enrichment',
        'Priority support',
        'Advanced analytics',
      ],
      isActive: true,
    },
  });

  // Create Professional Plan
  const proPlan = await prisma.plan.upsert({
    where: { name: 'professional' },
    update: {},
    create: {
      name: 'professional',
      displayName: 'Professional',
      description: 'For growing businesses with serious lead generation needs',
      price: 299900, // ₹2,999 in paise
      currency: 'INR',
      interval: 'month',
      maxLeads: 2000,
      maxEmails: 10000,
      maxCampaigns: 50,
      features: [
        '2,000 leads per month',
        '10,000 emails per month',
        '50 active campaigns',
        'Unlimited scraping jobs',
        'Email templates',
        'AI email generation',
        'Advanced lead enrichment',
        'Duplicate detection & merging',
        'Email tracking & analytics',
        'Custom integrations',
        'Priority support',
        'Advanced analytics & reports',
      ],
      isActive: true,
    },
  });

  // Create Enterprise Plan
  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'Unlimited everything for large organizations',
      price: 799900, // ₹7,999 in paise
      currency: 'INR',
      interval: 'month',
      maxLeads: -1, // Unlimited
      maxEmails: -1, // Unlimited
      maxCampaigns: -1, // Unlimited
      features: [
        'Unlimited leads',
        'Unlimited emails',
        'Unlimited campaigns',
        'Unlimited scraping jobs',
        'Email templates',
        'AI email generation',
        'Advanced lead enrichment',
        'Duplicate detection & merging',
        'Email tracking & analytics',
        'Custom integrations',
        'API access',
        'White-label options',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom analytics & reports',
      ],
      isActive: true,
    },
  });

  console.log('✅ Successfully seeded plans:');
  console.log('   - Free Plan:', freePlan.id);
  console.log('   - Starter Plan:', starterPlan.id);
  console.log('   - Professional Plan:', proPlan.id);
  console.log('   - Enterprise Plan:', enterprisePlan.id);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
