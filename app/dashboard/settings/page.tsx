'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Building, Save, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    description: '',
    service: '',
    targetAudience: '',
    valueProposition: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        website: profile.website || '',
        description: profile.description || '',
        service: profile.service || '',
        targetAudience: profile.targetAudience || '',
        valueProposition: profile.valueProposition || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean | number) => {
    if (field === 'smtpPort') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value as string) || 587 }));
    } else if (field === 'smtpSecure' || field === 'useAdminEmail') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' || value === true }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your business profile and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Business Profile</span>
            </CardTitle>
            <CardDescription>
              This information will be used to personalize your cold emails with AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Your company name"
                required
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Size */}
            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={formData.companySize} onValueChange={(value) => handleChange('companySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of your company"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Help AI understand what your company does
              </p>
            </div>

            {/* Service/Product */}
            <div className="space-y-2">
              <Label htmlFor="service">Your Service/Product *</Label>
              <Textarea
                id="service"
                value={formData.service}
                onChange={(e) => handleChange('service', e.target.value)}
                placeholder="What service or product do you offer?"
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Be specific - this will be used in email personalization
              </p>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleChange('targetAudience', e.target.value)}
                placeholder="e.g., Small business owners, CMOs, Healthcare providers"
              />
            </div>

            {/* Value Proposition */}
            <div className="space-y-2">
              <Label htmlFor="valueProposition">Value Proposition *</Label>
              <Textarea
                id="valueProposition"
                value={formData.valueProposition}
                onChange={(e) => handleChange('valueProposition', e.target.value)}
                placeholder="What makes your offer unique? How do you help customers?"
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used to craft compelling cold emails
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
