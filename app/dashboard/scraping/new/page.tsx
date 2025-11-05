'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const scrapingJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  businessCategory: z.string().min(1, 'Business category is required'),
  location: z.string().min(1, 'Location is required'),
  maxResults: z.number().min(1).max(1000),
});

type ScrapingJobForm = z.infer<typeof scrapingJobSchema>;

const popularCategories = [
  'Restaurants',
  'Hotels',
  'Real Estate',
  'Dentists',
  'Lawyers',
  'Plumbers',
  'Electricians',
  'Hair Salons',
  'Gyms',
  'Coffee Shops',
  'Retail Stores',
  'Medical Clinics',
  'Auto Repair',
  'Contractors',
  'Marketing Agencies',
];

export default function NewScrapingJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ScrapingJobForm>({
    resolver: zodResolver(scrapingJobSchema),
    defaultValues: {
      maxResults: 100,
    },
  });

  const onSubmit = async (data: ScrapingJobForm) => {
    setIsSubmitting(true);

    try {
      // Create jobs for all platforms to maximize leads
      const platforms = ['google-maps', 'yelp'];
      const jobPromises = platforms.map(async (platform) => {
        const platformName = platform === 'google-maps' ? 'Google Maps' : 'Yelp';
        const configuration = {
          platform,
          searchQuery: data.businessCategory,
          businessCategory: data.businessCategory,
          location: data.location,
          maxResults: Math.ceil(data.maxResults / platforms.length), // Split results across platforms
        };

        return fetch('/api/scraping/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${data.businessCategory} in ${data.location} - ${platformName}`,
            targetWebsite: platform,
            searchQuery: data.businessCategory,
            maxResults: configuration.maxResults,
            configuration,
          }),
        });
      });

      const responses = await Promise.all(jobPromises);
      const failedJobs = responses.filter(r => !r.ok);
      
      if (failedJobs.length === responses.length) {
        throw new Error('All scraping jobs failed to create');
      }

      if (failedJobs.length > 0) {
        toast.success(`Created ${responses.length - failedJobs.length}/${responses.length} scraping jobs`);
      } else {
        toast.success(`Created ${responses.length} scraping jobs across all platforms!`);
      }

      router.push('/dashboard/scraping');
    } catch (error) {
      toast.error('Failed to create scraping job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">New Scraping Job</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scraping Job Configuration</CardTitle>
            <CardDescription>
              Set up your lead generation job in a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Job Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Restaurants in San Francisco"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <Alert>
              <AlertDescription>
                🚀 Leads will be automatically collected from all available platforms (Google Maps, Yelp) to maximize results!
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessCategory">Business Category</Label>
                <Input
                  id="businessCategory"
                  {...register('businessCategory')}
                  placeholder="e.g., Restaurants, Dentists, Hotels"
                  list="categories"
                />
                <datalist id="categories">
                  {popularCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                {errors.businessCategory && (
                  <p className="text-sm text-red-600">{errors.businessCategory.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Popular: {popularCategories.slice(0, 5).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="e.g., San Francisco, CA"
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxResults">Maximum Results</Label>
              <Input
                id="maxResults"
                type="number"
                {...register('maxResults', { valueAsNumber: true })}
                min="1"
                max="1000"
              />
              {errors.maxResults && (
                <p className="text-sm text-red-600">{errors.maxResults.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Number of leads to scrape (1-1000)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/scraping')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}