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
import { Building, Save, Loader2, Mail, Key, Sparkles, Globe, Info, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGooglePlacesKey, setShowGooglePlacesKey] = useState(false);
  const [geminiKeyTouched, setGeminiKeyTouched] = useState(false);
  const [googlePlacesKeyTouched, setGooglePlacesKeyTouched] = useState(false);
  const [loadingGeminiKey, setLoadingGeminiKey] = useState(false);
  const [loadingGooglePlacesKey, setLoadingGooglePlacesKey] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    description: '',
    service: '',
    targetAudience: '',
    valueProposition: '',
    geminiApiKey: '',
    googlePlacesApiKey: '',
    aiModel: 'gemini-2.0-flash',
    preferredCurrency: 'USD',
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

  const { data: availableModels, isLoading: modelsLoading, refetch: refetchModels } = useQuery({
    queryKey: ['available-models'],
    queryFn: async () => {
      const response = await fetch('/api/ai/models');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch models');
      }
      return response.json();
    },
    enabled: false, // Don't fetch automatically
    retry: false,
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
        // Show placeholder bullets when key exists (unless user has edited the field)
        geminiApiKey: geminiKeyTouched ? formData.geminiApiKey : (profile.geminiApiKey || ''),
        googlePlacesApiKey: googlePlacesKeyTouched ? formData.googlePlacesApiKey : (profile.googlePlacesApiKey || ''),
        aiModel: profile.aiModel || 'gemini-2.0-flash',
        preferredCurrency: profile.preferredCurrency || 'USD',
      });
      // Reset touched state after loading profile
      if (!geminiKeyTouched) setGeminiKeyTouched(false);
      if (!googlePlacesKeyTouched) setGooglePlacesKeyTouched(false);
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
    onSuccess: (data, variables) => {
      toast.success('Profile updated successfully');
      // Reset touched states after successful save
      setGeminiKeyTouched(false);
      setGooglePlacesKeyTouched(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // If Gemini API key was updated, refetch available models
      if (variables.geminiApiKey && variables.geminiApiKey !== profile?.geminiApiKey && variables.geminiApiKey !== '••••••••') {
        setTimeout(() => refetchModels(), 500);
      }
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const fetchDecryptedKey = async (keyType: 'geminiApiKey' | 'googlePlacesApiKey') => {
    try {
      if (keyType === 'geminiApiKey') {
        setLoadingGeminiKey(true);
      } else {
        setLoadingGooglePlacesKey(true);
      }

      const response = await fetch('/api/profile/decrypt-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType }),
      });

      if (!response.ok) {
        throw new Error('Failed to decrypt key');
      }

      const data = await response.json();
      
      if (data.decryptedKey) {
        handleChange(keyType, data.decryptedKey);
        if (keyType === 'geminiApiKey') {
          setGeminiKeyTouched(true);
        } else {
          setGooglePlacesKeyTouched(true);
        }
      }
    } catch (error) {
      console.error('Error fetching decrypted key:', error);
      toast.error('Failed to load API key');
    } finally {
      if (keyType === 'geminiApiKey') {
        setLoadingGeminiKey(false);
      } else {
        setLoadingGooglePlacesKey(false);
      }
    }
  };

  const toggleGeminiKeyVisibility = async () => {
    if (!showGeminiKey && formData.geminiApiKey === '••••••••') {
      // Fetch the real key when showing for the first time
      await fetchDecryptedKey('geminiApiKey');
    }
    setShowGeminiKey(!showGeminiKey);
  };

  const toggleGooglePlacesKeyVisibility = async () => {
    if (!showGooglePlacesKey && formData.googlePlacesApiKey === '••••••••') {
      // Fetch the real key when showing for the first time
      await fetchDecryptedKey('googlePlacesApiKey');
    }
    setShowGooglePlacesKey(!showGooglePlacesKey);
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
    <div className="flex-1 space-y-6 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">Manage your business profile, API keys, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="ai-personalization" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Setup</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
            <span className="sm:hidden">Keys</span>
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic details about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                    <Select 
                      key={`currency-${formData.preferredCurrency}`}
                      value={formData.preferredCurrency} 
                      onValueChange={(value) => handleChange('preferredCurrency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                        <SelectItem value="CHF">CHF - Swiss Franc (Fr)</SelectItem>
                        <SelectItem value="SGD">SGD - Singapore Dollar (S$)</SelectItem>
                        <SelectItem value="AED">AED - UAE Dirham (د.إ)</SelectItem>
                        <SelectItem value="BRL">BRL - Brazilian Real (R$)</SelectItem>
                        <SelectItem value="MXN">MXN - Mexican Peso ($)</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand (R)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Current: {formData.preferredCurrency}</p>
                  </div>
                </div>
                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of your company"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Help AI understand what your company does
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-personalization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Personalization
                </CardTitle>
                <CardDescription>
                  This information powers AI-generated cold emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The more detailed and specific you are, the better your AI-generated emails will perform.
                  </AlertDescription>
                </Alert>

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

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => handleChange('targetAudience', e.target.value)}
                    placeholder="e.g., Small business owners, CMOs, Healthcare providers"
                  />
                </div>

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

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Use your own API keys to avoid rate limits and quota issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your API keys are encrypted and stored securely. They're only used when you run scraping jobs.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="geminiApiKey" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Gemini API Key
                      </Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="geminiApiKey"
                        type={showGeminiKey ? "text" : "password"}
                        value={formData.geminiApiKey}
                        onFocus={(e) => {
                          if (e.target.value === '••••••••') {
                            setGeminiKeyTouched(true);
                            handleChange('geminiApiKey', '');
                          }
                        }}
                        onChange={(e) => {
                          setGeminiKeyTouched(true);
                          handleChange('geminiApiKey', e.target.value);
                        }}
                        placeholder="Enter your Gemini API key"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={toggleGeminiKeyVisibility}
                        disabled={loadingGeminiKey}
                      >
                        {loadingGeminiKey ? (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        ) : showGeminiKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        Get your free API key from{' '}
                        <a 
                          href="https://ai.google.dev" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline font-medium"
                        >
                          Google AI Studio
                        </a>
                        . Used for AI-powered lead enrichment and data generation.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => refetchModels()}
                      disabled={modelsLoading || !formData.geminiApiKey}
                      className="mt-2"
                    >
                      {modelsLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        'Test API Key & Show Available Models'
                      )}
                    </Button>
                    {availableModels?.models && (
                      <Alert className="mt-2">
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-1">
                            ✓ API key valid! {availableModels.models.length} models available
                            {availableModels.usingUserKey && ' (using your key)'}
                          </div>
                          <div className="text-xs space-y-1">
                            {availableModels.models.slice(0, 5).map((model: any) => (
                              <div key={model.name} className="flex items-start gap-2">
                                <span className="font-mono text-primary">{model.name}</span>
                              </div>
                            ))}
                            {availableModels.models.length > 5 && (
                              <div className="text-muted-foreground">
                                ...and {availableModels.models.length - 5} more
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="aiModel" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Model
                      </Label>
                      {availableModels?.models?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {availableModels.models.length} available
                        </span>
                      )}
                    </div>
                    <Select
                      value={formData.aiModel}
                      onValueChange={(value) => handleChange('aiModel', value)}
                    >
                      <SelectTrigger id="aiModel">
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableModels?.models?.length > 0 ? (
                          <>
                            {/* Show currently selected model first if not in fetched list */}
                            {formData.aiModel && !availableModels.models.find((m: any) => m.name === formData.aiModel) && (
                              <SelectItem value={formData.aiModel}>
                                {formData.aiModel} (Current)
                              </SelectItem>
                            )}
                            {availableModels.models.map((model: any) => (
                              <SelectItem key={model.name} value={model.name}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{model.displayName}</span>
                                  {model.name !== model.displayName && (
                                    <span className="text-xs text-muted-foreground">{model.name}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        ) : (
                          <>
                            {/* Show currently selected model first if not in defaults */}
                            {formData.aiModel && !['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'].includes(formData.aiModel) && (
                              <SelectItem value={formData.aiModel}>
                                {formData.aiModel} (Current)
                              </SelectItem>
                            )}
                            <SelectItem value="gemini-2.0-flash">
                              Gemini 2.0 Flash (Recommended)
                            </SelectItem>
                            <SelectItem value="gemini-2.5-flash">
                              Gemini 2.5 Flash
                            </SelectItem>
                            <SelectItem value="gemini-2.5-pro">
                              Gemini 2.5 Pro
                            </SelectItem>
                            <SelectItem value="gemini-1.5-pro">
                              Gemini 1.5 Pro
                            </SelectItem>
                            <SelectItem value="gemini-1.5-flash">
                              Gemini 1.5 Flash
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {availableModels?.models?.length > 0 
                        ? `Choose from ${availableModels.models.length} available models from your API key`
                        : 'Test your API key above to load available models, or select from defaults'
                      }
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="googlePlacesApiKey" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Google Places API Key
                      </Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="googlePlacesApiKey"
                        type={showGooglePlacesKey ? "text" : "password"}
                        value={formData.googlePlacesApiKey}
                        onFocus={(e) => {
                          if (e.target.value === '••••••••') {
                            setGooglePlacesKeyTouched(true);
                            handleChange('googlePlacesApiKey', '');
                          }
                        }}
                        onChange={(e) => {
                          setGooglePlacesKeyTouched(true);
                          handleChange('googlePlacesApiKey', e.target.value);
                        }}
                        placeholder="Enter your Google Places API key"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={toggleGooglePlacesKeyVisibility}
                        disabled={loadingGooglePlacesKey}
                      >
                        {loadingGooglePlacesKey ? (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        ) : showGooglePlacesKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        Get your API key from{' '}
                        <a 
                          href="https://console.cloud.google.com/apis/credentials" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline font-medium"
                        >
                          Google Cloud Console
                        </a>
                        . Enable the Places API for your project. Used for verified business data and lead scraping.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save API Keys
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}
