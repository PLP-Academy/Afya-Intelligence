import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { generateAIInsights, getEducationalInsight } from '@/lib/aiInsights';
import {
  Heart,
  Plus,
  TrendingUp,
  Calendar,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle,
  Users,
  Globe,
  Moon,
  Sun,
  Menu,
  X,
  Settings,
  LogOut,
  Bell,
  Loader2,
  Phone,
  Shield
} from 'lucide-react';

type Symptom = Tables<'symptoms'> & { severity: number; pending?: boolean }; // Assuming severity is added to symptoms table
type UserProfile = Tables<'users'>;
type SubscriptionTier = Enums<'subscription_tier'>;

const Dashboard = () => {
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newSymptom, setNewSymptom] = useState('');
  const [severity, setSeverity] = useState(1);
  const [aiInsights, setAiInsights] = useState<Array<{
    type: string;
    message: string;
    severity: string;
    tierLevel?: string;
  }>>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedCurrency, setSelectedCurrency] = useState('KES'); // Default to KES

  // Currency exchange rates (base: USD)
  const exchangeRates = {
    USD: 1.0,
    KES: 150.0,
    EUR: 0.85,
    GBP: 0.75,
    CAD: 1.25,
    AUD: 1.35,
    JPY: 150.0,
  };

  // Currency symbols
  const currencySymbols = {
    USD: '$',
    KES: 'KES ',
    EUR: '€',
    GBP: '£',
    CAD: 'CAD$',
    AUD: 'AUD$',
    JPY: '¥',
  };

  // Function to convert USD price to selected currency
  const convertPrice = (usdPrice: number, currency: string) => {
    const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1.0;
    return Math.round(usdPrice * rate * 100) / 100; // Round to 2 decimal places
  };

  // Function to format price display
  const formatPrice = (usdPrice: number, currency: string) => {
    if (usdPrice === 0) return 'Free';
    const converted = convertPrice(usdPrice, currency);
    const symbol = currencySymbols[currency as keyof typeof currencySymbols];
    return `${symbol}${converted}`;
  };

  // Add payment functions
  const initiateUpgradePayment = async (tier: 'health_champion' | 'global_advocate') => {
    const tierPrices = {
      health_champion: 1.1,
      global_advocate: 3.0,
    };
    const priceKES = tierPrices[tier] * 150; // Convert to KES using fixed rate

    // Navigate to pricing page with currency selection
    navigate('/pricing');
  };

  const tierFeatures = {
    community_advocate: {
      name: 'Community Advocate',
      maxHistory: 30,
      features: ['Basic AI', '30-day history', 'Education modules'],
      color: 'bg-blue-500'
    },
    health_champion: {
      name: 'Health Champion',
      maxHistory: -1,
      features: ['Advanced AI', 'Unlimited history', 'Weekly reports', 'Data export'],
      color: 'bg-green-500'
    },
    global_advocate: {
      name: 'Global Advocate',
      maxHistory: -1,
      features: ['All features', 'Family tracking', 'Expert consultations', 'Research participation'],
      color: 'bg-purple-500'
    }
  } as const;

  // Fetch user profile
  const { data: userProfile, isLoading: isLoadingUserProfile, error: userProfileError } = useQuery<UserProfile>({
    queryKey: ['userProfile', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.id,
  });

  // Fetch symptoms
  const { data: symptoms = [], isLoading: isLoadingSymptoms, error: symptomsError } = useQuery<Symptom[]>({
    queryKey: ['symptoms', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', authUser.id)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data as Symptom[];
    },
    enabled: !!authUser?.id,
  });

  // Mutation for logging a new symptom
  const logSymptomMutation = useMutation({
    mutationFn: async (symptomData: { symptom: string; severity: number; timestamp: string; user_id: string }) => {
      console.log('🔄 Attempting to log symptom:', symptomData);
      const { data, error } = await supabase
        .from('symptoms')
        .insert([{
          symptom: symptomData.symptom,
          severity: symptomData.severity,
          timestamp: symptomData.timestamp,
          user_id: symptomData.user_id,
        }])
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Symptom logged successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Symptom logging completed:', data);
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      // Clear insights to trigger regeneration when symptoms change
      setAiInsights([]);
    },
    onError: (error: Error) => {
      console.error('🚫 Failed to log symptom:', error.message);

      // Handle offline storage if mutation fails due to network
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        console.log('📦 Storing symptom offline due to network issues');
        const symptomData = {
          symptom: newSymptom,
          severity: severity,
          timestamp: new Date().toISOString(),
          user_id: authUser?.id || ''
        };
        storeOfflineSymptom(symptomData);
      } else {
        console.error('Database error:', error);
      }
    }
  });

  useEffect(() => {
    // Dark mode
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Generate AI insights when symptoms or user tier change
  useEffect(() => {
    if (!symptoms || !userProfile) return; // Wait for data to be loaded

    const generateInsights = async () => {
      // Only show loading if we have symptoms to analyze
      setIsGeneratingInsights(true);

      try {
        // Use the user's subscription tier for insight generation
        const userTier = userProfile.tier as keyof typeof tierFeatures || 'community_advocate';
        const insights = await generateAIInsights([...symptoms], userTier as any);

        setAiInsights(insights);
      } catch (error) {
        console.error('Failed to generate AI insights:', error);
        // Fallback to basic educational insight
        const fallbackInsight = getEducationalInsight('community_advocate');
        setAiInsights([fallbackInsight]);
      } finally {
        setIsGeneratingInsights(false);
      }
    };

    // Small delay to prevent rapid re-generation
    const timeoutId = setTimeout(() => {
      generateInsights();
    }, symptoms.length > 0 ? 500 : 0); // Small delay only when there are symptoms

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - only run once on mount

  // Separate effect to update when key data changes (but NOT on every render)
  useEffect(() => {
    if (symptoms?.length > 0 && userProfile) {
      setAiInsights([]); // Clear insights first to trigger re-generation
    } else if (symptoms?.length === 0) {
      // No symptoms logged yet, show welcome message
      setAiInsights([{
        type: 'education',
        message: 'Welcome! Start logging your symptoms to receive personalized AI health insights.',
        severity: 'low',
        tierLevel: 'community_advocate'
      }]);
    }
  }, [symptoms?.length, userProfile?.tier]); // Only depend on length and tier, not the full symptoms array

  const handleLogSymptom = async () => {
    console.log('handleLogSymptom called. Checking conditions...');
    console.log('Symptom text:', newSymptom);
    console.log('Auth user:', authUser);

    if (!newSymptom.trim() || !authUser?.id) {
      console.log('Condition failed. Exiting function.');
      return;
    }

    const symptomData = {
      symptom: newSymptom,
      severity: severity,
      timestamp: new Date().toISOString(),
      user_id: authUser.id,
    };

    if (isOnline) {
      logSymptomMutation.mutate(symptomData);
    } else {
      storeOfflineSymptom(symptomData);
    }

    setNewSymptom('');
    setSeverity(1);
    setShowLogForm(false);
  };

  const storeOfflineSymptom = (symptomData: Omit<Symptom, 'id'>) => { // id is not available for offline symptoms
    const offline = JSON.parse(localStorage.getItem('offlineSymptoms') || '[]');
    offline.push(symptomData);
    localStorage.setItem('offlineSymptoms', JSON.stringify(offline));

    // Add to local state with pending flag (React Query will re-fetch later)
    // For now, we'll just let React Query handle the eventual refetch
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const exportData = () => {
    if (userProfile?.tier === 'community_advocate') {
      alert('Data export is available for Health Champion and Global Advocate tiers only.');
      return;
    }
    
    const csvContent = [
      ['Date', 'Symptom', 'Severity'],
      ...symptoms.map(s => [
        new Date(s.timestamp).toLocaleDateString(),
        s.symptom,
        s.severity
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'symptom-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentTier = tierFeatures[userProfile?.tier || 'community_advocate']; // Default to community_advocate

  if (isLoadingUserProfile || isLoadingSymptoms) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userProfileError || symptomsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Error loading data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline. Data will sync when connection is restored.</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg health-gradient flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">Afya Intelligence</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Badge className={`${currentTier.color} text-white`}>
                {currentTier.name}
              </Badge>
              <Button 
                onClick={toggleDarkMode}
                variant="ghost" 
                size="sm"
                className="p-2"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={() => alert('Notifications not yet implemented!')}>
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate('/profile')}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost" 
              size="sm"
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t bg-background py-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge className={`${currentTier.color} text-white`}>
                    {currentTier.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    onClick={toggleDarkMode}
                    variant="ghost" 
                    size="sm"
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile?.full_name || authUser?.email || 'User'}! 👋</h1>
              <p className="text-muted-foreground">
                Track your health journey and contribute to global wellness through SDG 3.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/family')}
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Users className="h-5 w-5 mr-2" />
                Family Tracking
              </Button>
              <Button
                onClick={() => setShowLogForm(true)}
                className="health-button"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Log Symptom
              </Button>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">AI Health Insights</h2>
            {isGeneratingInsights && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {userProfile?.tier === 'community_advocate' && (
              <Badge variant="secondary" className="text-xs">
                Basic AI
              </Badge>
            )}
            {(userProfile?.tier === 'health_champion' || userProfile?.tier === 'global_advocate') && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                Advanced AI
              </Badge>
            )}
          </div>

          {/* Show API key setup message only for premium users without API key */}
          {!import.meta.env.VITE_GEMINI_API_KEY && (userProfile?.tier === 'health_champion' || userProfile?.tier === 'global_advocate') && (
            <Alert className="mb-4 border-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>🚀 Complete Your Premium AI Setup:</strong>
                <br />
                You're on a premium tier, but AI insights are using local analysis due to missing API key.
                <br />
                <strong>To unlock advanced Google Gemini AI:</strong>
                <br />
                1. Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google AI Studio</a>
                <br />
                2. Create a new API key
                <br />
                3. Add it to your <code>.env</code> file as: <code>VITE_GEMINI_API_KEY="your_api_key_here"</code>
                <br />
                <em>Premium tier detected. Enhanced AI insights are available once configured!</em>
              </AlertDescription>
            </Alert>
          )}

          {/* Show congratulations message when premium user has API key set */}
          {import.meta.env.VITE_GEMINI_API_KEY && (userProfile?.tier === 'health_champion' || userProfile?.tier === 'global_advocate') && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>🎉 Premium AI Activated!</strong>
                <br />
                You're getting advanced Gemini AI-powered insights. Your premium configuration is complete!
              </AlertDescription>
            </Alert>
          )}

          {aiInsights.length > 0 ? (
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <Alert key={index} className={`${
                  insight.severity === 'high' ? 'border-destructive' :
                  insight.severity === 'medium' ? 'border-yellow-500' : 'border-primary'
                }`}>
                  {insight.severity === 'high' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{insight.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          ) : !isGeneratingInsights ? (
            <Card className="p-6 text-center">
              <div className="text-muted-foreground">
                {symptoms.length === 0
                  ? "No insights available at the moment. Start logging symptoms to receive personalized health insights!"
                  : "Processing your symptom data for personalized insights..."}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Generating personalized insights...</span>
              </div>
            </Card>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Symptoms */}
          <Card className="health-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{symptoms.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last week
              </p>
            </CardContent>
          </Card>

          {/* This Week */}
          <Card className="health-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">3</div>
              <p className="text-xs text-muted-foreground">
                Most recent: Headache
              </p>
            </CardContent>
          </Card>

          {/* Severity Trend */}
          <Card className="health-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">2.1</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Improving trend
              </p>
            </CardContent>
          </Card>

          {/* Community Impact */}
          <Card className="health-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">847</div>
              <p className="text-xs text-muted-foreground">
                People helped through data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Symptoms */}
          <div className="lg:col-span-2">
            <Card className="health-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Symptoms</CardTitle>
                  <div className="flex gap-2">
                    {userProfile?.tier !== 'community_advocate' && (
                      <Button 
                        onClick={exportData}
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {symptoms.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No symptoms logged yet.</p>
                    <Button 
                      onClick={() => setShowLogForm(true)}
                      className="mt-4"
                      variant="outline"
                    >
                      Log your first symptom
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {symptoms.slice(0, 10).map((symptom) => (
                      <div key={symptom.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            symptom.pending ? 'bg-yellow-500' :
                            symptom.severity <= 1 ? 'bg-green-500' :
                            symptom.severity <= 2 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="font-medium">{symptom.symptom}</div>
                            <div className="text-sm text-muted-foreground">
                              Severity: {symptom.severity}/5
                              {symptom.pending && ' (Pending sync)'}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(symptom.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Plan */}
            <Card className="health-card border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Your Subscription
                </CardTitle>
                <CardDescription>
                  Manage your plan and access level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Plan */}
                  <div className="p-4 rounded-lg border bg-background/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${currentTier.color}`}></div>
                        <div>
                          <div className="font-semibold">{currentTier.name}</div>
                          {userProfile?.tier === 'community_advocate' && (
                            <div className="text-sm text-muted-foreground">Free forever</div>
                          )}
                          {userProfile?.tier === 'health_champion' && (
                            <div className="text-sm text-muted-foreground">Premium subscription</div>
                          )}
                          {userProfile?.tier === 'global_advocate' && (
                            <div className="text-sm text-muted-foreground">Premium + Premium</div>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`${
                          userProfile?.tier === 'global_advocate' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {userProfile?.tier === 'global_advocate' ? 'Top Tier' : 'Active'}
                      </Badge>
                    </div>

                    {/* Plan Features */}
                    <div className="space-y-2">
                      {currentTier.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                      {currentTier.features.length > 3 && (
                        <div className="text-xs text-muted-foreground ml-5">
                          +{currentTier.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upgrade Options */}
                  {userProfile?.tier !== 'global_advocate' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Available Upgrades:</h4>

                      {/* Health Champion Upgrade */}
                      {userProfile?.tier === 'community_advocate' && (
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="font-medium text-sm">Health Champion</span>
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              $1.10/month
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-2">
                            <span>✨ Advanced AI</span>
                            <span>📊 Unlimited history</span>
                          </div>
                          <Button
                            onClick={() => navigate('/pricing')}
                            className="w-full text-xs h-7 bg-green-600 hover:bg-green-700"
                          >
                            Upgrade to Health Champion
                          </Button>
                        </div>
                      )}

                      {/* Global Advocate Upgrade */}
                      {userProfile?.tier === 'health_champion' && (
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="font-medium text-sm">Global Advocate</span>
                            </div>
                            <div className="text-sm font-semibold text-purple-600">
                              $3.00/month
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-2">
                            <span>🔬 Expert consultations</span>
                            <span>👨‍👩‍👧 Family tracking</span>
                          </div>
                          <Button
                            onClick={() => navigate('/pricing')}
                            className="w-full text-xs h-7 bg-purple-600 hover:bg-purple-700"
                          >
                            Upgrade to Global Advocate
                          </Button>
                        </div>
                      )}

                      {/* Both tiers available */}
                      {userProfile?.tier === 'community_advocate' && (
                        <div className="p-3 border rounded-lg bg-purple-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="font-medium text-sm">Global Advocate</span>
                            </div>
                            <div className="text-sm font-semibold text-purple-600">
                              $3.00/month
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            All features included - best value!
                          </div>
                          <Button
                            onClick={() => navigate('/pricing')}
                            variant="outline"
                            className="w-full text-xs h-7 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            Jump to Global Advocate
                          </Button>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <Button
                          onClick={() => navigate('/pricing')}
                          variant="outline"
                          className="w-full text-sm"
                        >
                          View All Plans & Pricing Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Premium User */}
                  {userProfile?.tier === 'global_advocate' && (
                    <div className="text-center">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800 mb-1">
                          You're on our top tier!
                        </p>
                        <p className="text-xs text-green-700">
                          Enjoy all premium features and help us achieve SDG 3.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SDG Progress */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="text-lg">SDG 3 Progress</CardTitle>
                <CardDescription>Your contribution to global health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Data Points Contributed</span>
                      <span>847</span>
                    </div>
                    <Progress value={67} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Education Completed</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Globe className="h-4 w-4" />
                      Global Impact
                    </div>
                    <div className="text-xs space-y-1">
                      <div>• 12,847 people helped</div>
                      <div>• 34 communities reached</div>
                      <div>• 1,247 early detections</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowLogForm(true)}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log Symptom
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => alert('Calendar view not yet implemented!')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/family')}>
                    <Users className="h-4 w-4 mr-2" />
                    Family Tracking
                  </Button>
                  {userProfile?.tier !== 'community_advocate' && (
                    <Button 
                      onClick={exportData}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Log Symptom Modal */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Log New Symptom</CardTitle>
                <Button 
                  onClick={() => setShowLogForm(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Record your symptoms to track patterns and get AI insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symptom Description</label>
                <Textarea
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  placeholder="Describe your symptom in detail (e.g., Sharp headache on left side, lasted 2 hours)"
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Severity (1-5): {severity}
                </label>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full"
                  aria-label="Symptom Severity"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => setShowLogForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleLogSymptom}
                  disabled={!newSymptom.trim()}
                  className="flex-1 health-button"
                >
                  Log Symptom
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
