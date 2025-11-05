import { prisma } from './prisma';

export interface EmailLogData {
  userId: string;
  leadId?: string;
  campaignId?: string;
  to: string;
  subject: string;
  body?: string;
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED' | 'REPLIED';
  metadata?: any;
}

/**
 * Create a new email log entry
 */
export async function createEmailLog(data: EmailLogData) {
  try {
    const log = await prisma.emailLog.create({
      data: {
        userId: data.userId,
        leadId: data.leadId,
        campaignId: data.campaignId,
        to: data.to,
        subject: data.subject,
        body: data.body,
        status: data.status || 'PENDING',
        metadata: data.metadata,
      },
    });
    
    return log;
  } catch (error) {
    console.error('Error creating email log:', error);
    throw error;
  }
}

/**
 * Update email log status
 */
export async function updateEmailLogStatus(
  logId: string,
  status: 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED' | 'REPLIED',
  errorMessage?: string
) {
  try {
    const updates: any = { status };
    
    // Set timestamp based on status
    if (status === 'SENT') {
      updates.sentAt = new Date();
    } else if (status === 'DELIVERED') {
      updates.deliveredAt = new Date();
    } else if (status === 'OPENED') {
      updates.openedAt = new Date();
    } else if (status === 'CLICKED') {
      updates.clickedAt = new Date();
    } else if (status === 'BOUNCED') {
      updates.bouncedAt = new Date();
    } else if (status === 'REPLIED') {
      updates.repliedAt = new Date();
    }
    
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    
    const log = await prisma.emailLog.update({
      where: { id: logId },
      data: updates,
    });
    
    return log;
  } catch (error) {
    console.error('Error updating email log:', error);
    throw error;
  }
}

/**
 * Track email open event
 */
export async function trackEmailOpen(logId: string) {
  try {
    // Only update if not already opened
    const log = await prisma.emailLog.findUnique({
      where: { id: logId },
      select: { openedAt: true },
    });
    
    if (!log?.openedAt) {
      return updateEmailLogStatus(logId, 'OPENED');
    }
    
    return log;
  } catch (error) {
    console.error('Error tracking email open:', error);
    throw error;
  }
}

/**
 * Track email click event
 */
export async function trackEmailClick(logId: string) {
  try {
    // Only update if not already clicked
    const log = await prisma.emailLog.findUnique({
      where: { id: logId },
      select: { clickedAt: true },
    });
    
    if (!log?.clickedAt) {
      return updateEmailLogStatus(logId, 'CLICKED');
    }
    
    return log;
  } catch (error) {
    console.error('Error tracking email click:', error);
    throw error;
  }
}

/**
 * Track email reply
 */
export async function trackEmailReply(
  logId: string,
  replySubject: string,
  replyBody: string
) {
  try {
    const log = await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'REPLIED',
        repliedAt: new Date(),
        replySubject,
        replyBody,
      },
    });
    
    return log;
  } catch (error) {
    console.error('Error tracking email reply:', error);
    throw error;
  }
}

/**
 * Find email log by recipient email and subject for reply matching
 */
export async function findEmailLogForReply(
  recipientEmail: string,
  originalSubject: string,
  userId?: string
) {
  try {
    // Try to find the original email by matching recipient and subject
    const where: any = {
      to: recipientEmail,
      status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
    };
    
    if (userId) {
      where.userId = userId;
    }
    
    // Look for emails sent in the last 30 days
    where.sentAt = {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
    
    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 10,
    });
    
    // Try to match by subject (removing Re:, Fwd:, etc.)
    const cleanSubject = originalSubject
      .replace(/^(re:|fwd?:|fw:)/i, '')
      .trim()
      .toLowerCase();
    
    const matchedLog = logs.find((log) =>
      log.subject.toLowerCase().includes(cleanSubject) ||
      cleanSubject.includes(log.subject.toLowerCase())
    );
    
    return matchedLog || logs[0]; // Return best match or most recent
  } catch (error) {
    console.error('Error finding email log for reply:', error);
    throw error;
  }
}

/**
 * Get email logs for a user
 */
export async function getUserEmailLogs(
  userId: string,
  options?: {
    skip?: number;
    take?: number;
    status?: string;
    search?: string;
  }
) {
  const where: any = { userId };
  
  if (options?.status) {
    where.status = options.status;
  }
  
  if (options?.search) {
    where.OR = [
      { to: { contains: options.search, mode: 'insensitive' } },
      { subject: { contains: options.search, mode: 'insensitive' } },
    ];
  }
  
  try {
    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: options?.skip || 0,
        take: options?.take || 20,
        include: {
          lead: {
            select: {
              companyName: true,
              contactName: true,
            },
          },
          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.emailLog.count({ where }),
    ]);
    
    return { logs, total };
  } catch (error) {
    console.error('Error fetching email logs:', error);
    throw error;
  }
}
