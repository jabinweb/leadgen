# LeadGen Pro - Complete Lead Generation Platform

A comprehensive lead generation solution that automates the entire lead lifecycle - from scraping and enrichment to cold email campaigns and conversion tracking.

## 🚀 Features

### Multi-Platform Lead Scraping
- **Google Maps** - Extract business listings with ratings, reviews, contact info (uses Google Places API)
- **Yelp** - AI-powered lead generation using Google Gemini (free solution)
- **Facebook** - Find business pages and groups
- **Instagram** - Discover business accounts and extract profile data
- **Custom Websites** - Configure custom selectors for any website

### Complete Lead Management
- **Lead Pipeline** - Track leads through stages: New → Contacted → Responded → Qualified → Converted
- **Lead Enrichment** - Automatically enrich leads with additional data (emails, phones, social profiles)
- **Activity Tracking** - Complete history of all interactions with each lead
- **Advanced Filtering** - Search and filter by industry, source, status, tags
- **Bulk Operations** - Manage multiple leads at once
- **Data Export** - Export to CSV and JSON formats

### Cold Email Campaigns
- **Email Templates** - Pre-built and custom templates with variables
- **Personalization** - Dynamic variables ({{companyName}}, {{contactName}}, etc.)
- **Scheduling** - Schedule campaigns for optimal send times
- **A/B Testing** - Test different subject lines and content
- **Open Tracking** - Track when recipients open your emails
- **Click Tracking** - Monitor link clicks in your emails
- **Reply Detection** - Automatically update lead status on replies
- **Analytics Dashboard** - View campaign performance metrics

### Analytics & Reporting
- Real-time campaign metrics (open rate, click rate, conversion rate)
- Lead source attribution
- Pipeline conversion tracking
- Activity timeline
- Export capabilities

## 🛠 Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Web Scraping**: Playwright
- **Email**: Resend / SendGrid / SMTP
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)
- Email service account (Resend or SendGrid recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd leadgen
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Update `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GEMINI_API_KEY` - Get free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `GOOGLE_PLACES_API_KEY` - Optional: Get from [Google Cloud Console](https://console.cloud.google.com/)
- `EMAIL_PROVIDER` - Choose: `resend`, `sendgrid`, or `smtp`
- `EMAIL_API_KEY` - Your email provider API key

### 3. Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📖 Detailed Setup

For comprehensive setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 📚 Usage

### Scraping Leads

1. Go to **Dashboard → Scraping → New Job**
2. Select platform (Google Maps, Yelp, Facebook, Instagram, or Custom)
3. Enter search query and parameters
4. Click **Start Scraping**
5. Monitor progress in real-time

### Managing Leads

1. Navigate to **Dashboard → Leads**
2. View, search, and filter your leads
3. Click a lead to view details and history
4. Enrich leads with additional data
5. Update status through the pipeline
6. Add notes and tags for organization

### Creating Email Campaigns

1. Go to **Dashboard → Campaigns → New Campaign**
2. Choose an email template or create custom
3. Personalize with variables ({{companyName}}, {{contactName}})
4. Select target leads
5. Preview and test
6. Send immediately or schedule

### Tracking Performance

- View campaign metrics (opens, clicks, replies)
- Monitor lead pipeline conversion rates
- Export data for external analysis
- Review activity timelines

## 🎯 Platform Capabilities

### Google Maps Scraping
- Search businesses by query and location
- Extract: name, rating, reviews, phone, address, website, hours
- Get GPS coordinates
- Uses official Google Places API for reliable data
- Falls back to web scraping if API unavailable

### Yelp / Business Directory
- Generates business leads using Google Gemini AI
- Free solution (no expensive API subscriptions)
- Provides: business names, addresses, phones, websites
- Smart lead generation based on category and location

### Facebook & Instagram
- Find business pages and profiles
- Extract: bio, contact info, social links
- Note: Limited by platform restrictions

### Custom Website Scraping
- Configure custom CSS selectors
- Pagination support
- Field mapping
- Works with any website structure

## 📧 Email Templates

Use dynamic variables in your templates:

```
Hi {{contactName}},

I noticed {{companyName}} is doing great work in {{industry}}.

I wanted to reach out because...

Best regards,
Your Name
{{yourCompany}}
```

Available variables:
- `{{companyName}}` - Business name
- `{{contactName}}` - Contact person
- `{{email}}` - Lead email
- `{{phone}}` - Phone number
- `{{website}}` - Website URL
- `{{industry}}` - Industry/category
- `{{address}}` - Business address

## 🔒 Security & Compliance

- Secure authentication with NextAuth.js
- Encrypted API keys and secrets
- GDPR-compliant data handling
- CAN-SPAM Act compliance features
- Rate limiting for scraping
- Data export and deletion capabilities

## 🚀 Production Deployment

### Environment Variables

```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://...
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your-key
```

### Build & Deploy

```bash
npm run build
npm start
```

### Deployment Options
- **Vercel** - Recommended for Next.js
- **Docker** - Container deployment
- **VPS** - Traditional server hosting

## 📊 Database Schema

Key models:
- **Lead** - Business/contact information with status tracking
- **LeadEnrichment** - Additional data (social profiles, technologies)
- **EmailCampaign** - Campaign configuration and metrics
- **EmailCampaignLead** - Individual email tracking
- **EmailEvent** - Detailed event logging (opens, clicks)
- **LeadActivity** - Activity timeline
- **ScrapingJob** - Scraping job configuration and status

## 🛠 Development

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # UI components (shadcn)
│   ├── dashboard/        # Dashboard-specific components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── scraping/         # Scraping logic
│   ├── email/            # Email service
│   └── enrichment/       # Lead enrichment
├── prisma/               # Database schema
└── types/                # TypeScript types
```

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
npx prisma migrate   # Run migrations
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For help and support:
- 📖 Read the [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🐛 Report issues on GitHub
- 💬 Check existing documentation

## 🎉 Acknowledgments

Built with:
- Next.js
- Prisma
- Playwright
- Shadcn/ui
- Radix UI
- TanStack Query
- And many other amazing open-source projects

---

Made with ❤️ for better lead generation
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/leadgen"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts and authentication
- **Leads**: Collected lead information
- **ScrapingJobs**: Scraping job configurations and status
- **ScrapingLogs**: Detailed logging for scraping operations

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Leads
- `GET /api/leads` - List leads with pagination and filters
- `POST /api/leads` - Create a new lead manually
- `GET /api/leads/export` - Export leads (CSV/JSON)

### Scraping Jobs
- `GET /api/scraping/jobs` - List scraping jobs
- `POST /api/scraping/jobs` - Create a new scraping job
- `GET /api/scraping/status` - Get queue status

## Usage

### Creating a Scraping Job

1. Navigate to "New Scraping Job" in the dashboard
2. Configure job parameters:
   - Job name and target website URL
   - Search query (optional)
   - Maximum results limit
   - Website template or custom selectors
3. Submit the job to start scraping

### Managing Leads

1. View all leads in the "Leads" section
2. Use search and filter options to find specific leads
3. Export filtered results in CSV or JSON format
4. Track lead sources and validation status

### Monitoring Progress

1. Check the "Scraping Jobs" section for job status
2. Monitor real-time progress with live updates
3. View detailed statistics and error logs
4. Track queue status and concurrent job limits

## Deployment

### Environment Setup

Ensure these environment variables are set in production:

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### Build and Deploy

```bash
npm run build
npm start
```

### Database Migration

```bash
npx prisma generate
npx prisma db push
```

## Configuration

### Rate Limiting

Configure scraping rate limits in your environment:

```env
SCRAPING_RATE_LIMIT=10
SCRAPING_CONCURRENT_LIMIT=3
```

### Custom Website Templates

Add new scraping templates by extending the `websiteTemplates` array in:
`app/dashboard/scraping/new/page.tsx`

## Security Considerations

- **Rate Limiting**: Implement proper rate limiting for scraping operations
- **Robots.txt Compliance**: Respect website robots.txt files
- **User Agents**: Use appropriate user agent strings
- **Data Privacy**: Handle scraped data according to privacy regulations
- **Authentication**: Secure all API endpoints with proper authentication

## Legal Compliance

- Always check website terms of service before scraping
- Respect robots.txt files and crawl delays
- Implement proper rate limiting to avoid overloading target servers
- Consider data privacy regulations (GDPR, CCPA, etc.)
- Use scraped data responsibly and ethically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints and examples

## Roadmap

- [ ] Advanced scraping templates for popular websites
- [ ] Machine learning for data quality scoring
- [ ] Integration with popular CRM systems
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Multi-tenant support
- [ ] Advanced scheduling for scraping jobs