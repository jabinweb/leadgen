'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  requireEmail: z.boolean().default(false),
  requirePhone: z.boolean().default(false),
  requireWebsite: z.boolean().default(false),
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
    control,
  } = useForm<ScrapingJobForm>({
    resolver: zodResolver(scrapingJobSchema),
    defaultValues: {
      maxResults: 100,
      requireEmail: false,
      requirePhone: false,
      requireWebsite: false,
    },
  });

  const onSubmit = async (data: ScrapingJobForm) => {
    setIsSubmitting(true);

    try {
      // Create single job with Google Maps (will fallback to Gemini AI if needed)
      const platform = 'google-maps';
      const configuration = {
        platform,
        searchQuery: data.businessCategory,
        businessCategory: data.businessCategory,
        location: data.location,
        maxResults: data.maxResults,
        filters: {
          requireEmail: data.requireEmail,
          requirePhone: data.requirePhone,
          requireWebsite: data.requireWebsite,
        },
      };

      console.log('Creating job with filters:', configuration.filters);

      const response = await fetch('/api/scraping/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${data.businessCategory} in ${data.location}`,
          targetWebsite: platform,
          searchQuery: data.businessCategory,
          maxResults: configuration.maxResults,
          configuration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create scraping job');
      }

      toast.success('Scraping job created successfully!');
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
              <AlertDescription className="text-sm">
                🚀 Leads will be automatically collected from multiple sources (Google Places API + AI) to maximize results and provide complete contact information!
              </AlertDescription>
            </Alert>            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Lead Quality Filters</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which contact information is required. Leads missing checked fields will be excluded.
                </p>
                <Alert className="mt-2">
                  <AlertDescription className="text-xs">
                    💡 <strong>Smart Sourcing:</strong> We combine leads from Google Places API (verified data with phones/websites) 
                    and AI generation (adds emails and additional leads). Duplicates are automatically merged with preference for real data.
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="requireEmail"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="requireEmail"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="requireEmail" className="font-normal cursor-pointer">
                    Require Email Address
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="requirePhone"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="requirePhone"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="requirePhone" className="font-normal cursor-pointer">
                    Require Phone Number
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="requireWebsite"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="requireWebsite"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="requireWebsite" className="font-normal cursor-pointer">
                    Require Website
                  </Label>
                </div>
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