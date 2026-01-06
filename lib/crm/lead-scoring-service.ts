import { prisma } from '@/lib/prisma';

export class LeadScoringService {
  /**
   * Calculate lead score
   */
  async calculateLeadScore(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        emailLogs: {
          select: {
            openedAt: true,
            clickedAt: true,
            repliedAt: true,
          },
        },
        enrichmentData: true,
      },
    });

    if (!lead) throw new Error('Lead not found');

    // 1. Engagement Score (0-35 points)
    const engagementScore = this.calculateEngagementScore(lead.emailLogs);

    // 2. Data Quality Score (0-25 points)
    const dataQualityScore = this.calculateDataQualityScore(lead);

    // 3. Fit Score (0-40 points)
    const fitScore = this.calculateFitScore(lead);

    const totalScore = Math.min(100, engagementScore + dataQualityScore + fitScore);

    // Save or update score
    await prisma.leadScore.upsert({
      where: { leadId },
      create: {
        leadId,
        totalScore,
        engagementScore,
        dataQualityScore,
        fitScore,
      },
      update: {
        totalScore,
        engagementScore,
        dataQualityScore,
        fitScore,
        lastCalculatedAt: new Date(),
      },
    });

    // Auto-qualify if score is high
    if (totalScore >= 70 && lead.status === 'NEW') {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'QUALIFIED' },
      });

      await prisma.leadActivity.create({
        data: {
          leadId,
          activityType: 'STATUS_CHANGED',
          description: `Auto-qualified (score: ${totalScore})`,
        },
      });
    }

    return { totalScore, engagementScore, dataQualityScore, fitScore };
  }

  /**
   * Engagement Score (0-35)
   * - Email opened: +5 points per open (max 15)
   * - Link clicked: +10 points per click (max 10)
   * - Email replied: +10 points (once)
   */
  private calculateEngagementScore(emailLogs: any[]): number {
    let score = 0;

    const opensCount = emailLogs.filter((e) => e.openedAt).length;
    score += Math.min(15, opensCount * 5);

    const clicksCount = emailLogs.filter((e) => e.clickedAt).length;
    score += Math.min(10, clicksCount * 10);

    const hasReplied = emailLogs.some((e) => e.repliedAt);
    if (hasReplied) score += 10;

    return Math.min(35, score);
  }

  /**
   * Data Quality Score (0-25)
   * - Has email: +8
   * - Has phone: +5
   * - Has website: +5
   * - Has contact name: +3
   * - Has address: +2
   * - Is enriched: +2
   */
  private calculateDataQualityScore(lead: any): number {
    let score = 0;

    if (lead.email) score += 8;
    if (lead.phone) score += 5;
    if (lead.website) score += 5;
    if (lead.contactName) score += 3;
    if (lead.address) score += 2;
    if (lead.isEnriched) score += 2;

    return Math.min(25, score);
  }

  /**
   * Fit Score (0-40)
   * - Industry match: +15 (if in target industries)
   * - Company size: +10 (based on employee count)
   * - Has revenue data: +5
   * - Rating/reviews: +5 (good ratings)
   * - Source quality: +5 (verified sources)
   */
  private calculateFitScore(lead: any): number {
    let score = 0;

    // Target industries (customize based on your target)
    const targetIndustries = ['Technology', 'Software', 'SaaS', 'E-commerce', 'Marketing'];
    if (lead.industry && targetIndustries.some((t) => lead.industry.toLowerCase().includes(t.toLowerCase()))) {
      score += 15;
    }

    // Company size
    if (lead.employeeCount) {
      if (lead.employeeCount >= 50 && lead.employeeCount <= 500) score += 10; // Sweet spot
      else if (lead.employeeCount >= 10) score += 5;
    }

    // Revenue data
    if (lead.revenue) score += 5;

    // Rating
    if (lead.rating && lead.rating >= 4.0) score += 5;

    // Verified sources
    const verifiedSources = ['Google Places API', 'LinkedIn', 'Official Website'];
    if (verifiedSources.includes(lead.source)) score += 5;

    return Math.min(40, score);
  }

  /**
   * Calculate scores for all leads (batch)
   */
  async calculateAllScores(userId: string) {
    const leads = await prisma.lead.findMany({
      where: { userId },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      leads.map((lead) => this.calculateLeadScore(lead.id))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { total: leads.length, succeeded, failed };
  }

  /**
   * Get leads by score range
   */
  async getLeadsByScore(userId: string, minScore: number, maxScore: number = 100) {
    const leadScores = await prisma.leadScore.findMany({
      where: {
        totalScore: {
          gte: minScore,
          lte: maxScore,
        },
        lead: {
          userId,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            email: true,
            phone: true,
            industry: true,
            status: true,
          },
        },
      },
      orderBy: {
        totalScore: 'desc',
      },
    });

    return leadScores;
  }

  /**
   * Get hot leads (score >= 70)
   */
  async getHotLeads(userId: string) {
    return await this.getLeadsByScore(userId, 70);
  }

  /**
   * Get warm leads (score 40-69)
   */
  async getWarmLeads(userId: string) {
    return await this.getLeadsByScore(userId, 40, 69);
  }

  /**
   * Get cold leads (score < 40)
   */
  async getColdLeads(userId: string) {
    return await this.getLeadsByScore(userId, 0, 39);
  }

  /**
   * Get scoring distribution
   */
  async getScoringDistribution(userId: string) {
    const scores = await prisma.leadScore.findMany({
      where: {
        lead: {
          userId,
        },
      },
      select: {
        totalScore: true,
      },
    });

    return {
      hot: scores.filter((s) => s.totalScore >= 70).length,
      warm: scores.filter((s) => s.totalScore >= 40 && s.totalScore < 70).length,
      cold: scores.filter((s) => s.totalScore < 40).length,
      total: scores.length,
      average: scores.length > 0 
        ? scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length 
        : 0,
    };
  }
}

export const leadScoringService = new LeadScoringService();
