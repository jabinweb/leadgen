// @ts-ignore - imap types may not be perfect
import Imap from 'imap';
// @ts-ignore - mailparser types may not be perfect
import { simpleParser } from 'mailparser';
import { findEmailLogForReply, trackEmailReply } from '@/lib/email-logger';
import { prisma } from '@/lib/prisma';

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string;
  date?: Date;
}

export class ImapReplyChecker {
  private config: ImapConfig;

  constructor() {
    this.config = {
      user: process.env.IMAP_USER || '',
      password: process.env.IMAP_PASSWORD || '',
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: process.env.IMAP_TLS !== 'false',
    };
  }

  isConfigured(): boolean {
    return !!(this.config.user && this.config.password);
  }

  async checkForReplies(since?: Date): Promise<{ processed: number; errors: string[] }> {
    if (!this.isConfigured()) {
      throw new Error('IMAP not configured. Set IMAP_USER and IMAP_PASSWORD in .env');
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false },
      });

      let processed = 0;
      const errors: string[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, async (err: any, box: any) => {
          if (err) {
            errors.push(`Failed to open inbox: ${err.message}`);
            imap.end();
            return;
          }

          // Search for unread emails or emails since a specific date
          const searchCriteria = since
            ? [['SINCE', since]]
            : ['UNSEEN'];

          imap.search(searchCriteria, (err: any, results: any) => {
            if (err) {
              errors.push(`Search failed: ${err.message}`);
              imap.end();
              return;
            }

            if (!results || results.length === 0) {
              console.log('No new emails found');
              imap.end();
              resolve({ processed: 0, errors });
              return;
            }

            const fetch = imap.fetch(results, { bodies: '' });

            fetch.on('message', (msg: any) => {
              msg.on('body', (stream: any) => {
                simpleParser(stream, async (err: any, parsed: any) => {
                  if (err) {
                    errors.push(`Parse error: ${err.message}`);
                    return;
                  }

                  try {
                    await this.processEmail(parsed);
                    processed++;
                  } catch (error: any) {
                    errors.push(`Process error: ${error.message}`);
                  }
                });
              });
            });

            fetch.once('error', (err: any) => {
              errors.push(`Fetch error: ${err.message}`);
            });

            fetch.once('end', () => {
              console.log('Done fetching all messages');
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err: any) => {
        errors.push(`Connection error: ${err.message}`);
        reject(new Error(`IMAP error: ${err.message}`));
      });

      imap.once('end', () => {
        resolve({ processed, errors });
      });

      imap.connect();
    });
  }

  private async processEmail(parsed: any): Promise<void> {
    const from = parsed.from?.value?.[0]?.address || '';
    const to = parsed.to?.value?.[0]?.address || '';
    const subject = parsed.subject || '';
    const text = parsed.text || '';
    const html = parsed.html || '';
    const messageId = parsed.messageId || '';
    const inReplyTo = parsed.inReplyTo || '';

    console.log(`Processing email from ${from} with subject: ${subject}`);

    // Try to find the original email this is replying to
    const originalLog = await findEmailLogForReply(from, subject);

    if (!originalLog) {
      console.log(`No matching original email found for reply from ${from}`);
      return;
    }

    console.log(`Found original email: ${originalLog.id}`);

    // Track the reply
    await trackEmailReply(originalLog.id, subject, text || html);

    // Create lead activity
    if (originalLog.leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId: originalLog.leadId,
          activityType: 'EMAIL_REPLIED',
          description: `Received email reply: ${subject}`,
          metadata: {
            from,
            subject,
            preview: text?.substring(0, 200) || html?.substring(0, 200),
            messageId,
            inReplyTo,
          },
          userId: originalLog.userId,
        },
      });

      // Update lead status if it's still NEW or CONTACTED
      const lead = await prisma.lead.findUnique({
        where: { id: originalLog.leadId },
        select: { status: true },
      });

      if (lead?.status === 'NEW' || lead?.status === 'CONTACTED') {
        await prisma.lead.update({
          where: { id: originalLog.leadId },
          data: {
            status: 'RESPONDED',
            lastContactedAt: new Date(),
          },
        });
      }

      console.log('✅ Updated lead activity and status');
    }

    // If part of a campaign, update campaign stats
    if (originalLog.campaignId) {
      await prisma.emailCampaign.update({
        where: { id: originalLog.campaignId },
        data: {
          replyCount: { increment: 1 },
        },
      });

      console.log('✅ Updated campaign reply count');
    }
  }
}

// Singleton instance
let imapChecker: ImapReplyChecker | null = null;

export function getImapReplyChecker(): ImapReplyChecker {
  if (!imapChecker) {
    imapChecker = new ImapReplyChecker();
  }
  return imapChecker;
}
