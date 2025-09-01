import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
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
  Loader2
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
  const [aiInsights, setAiInsights] = useState([]); // Still using mock for now
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const tierFeatures: Record<SubscriptionTier, { name: string; maxHistory: number; features: string[]; color: string }> = {
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
  };

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
      const { data, error } = await supabase
        .from('symptoms')
        .insert([{
          symptom: symptomData.symptom,
          severity: symptomData.severity,
          timestamp: symptomData.timestamp,
          user_id: symptomData.user_id,
        }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      // TODO: Trigger AI insights update
    },
    onError: (error: any) => { // Explicitly type error as any for now to access .message and .details
      console.error('Failed to log symptom:', error.message || error);
      if (error.details) {
        console.error('Supabase error details:', error.details);
      }
      // Handle offline storage if mutation fails due to network
      const symptomData = {
        symptom: newSymptom,
        severity: severity,
        timestamp: new Date().toISOString(),
        user_id: authUser?.id || ''
      };
      storeOfflineSymptom(symptomData);
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

  // Mock AI insights for now
  useEffect(() => {
    setAiInsights([
      {
        type: 'pattern',
        message: 'You\'ve logged headaches 3 times this week. Consider tracking sleep and hydration.',
        severity: 'medium'
      },
      {
        type: 'alert',
        message: 'Fatigue combined with headaches may indicate dehydration. Consult a healthcare provider if symptoms persist.',
        severity: 'high'
      }
    ]);
  }, [symptoms]); // Re-evaluate AI insights when symptoms change

  const handleLogSymptom = async () => {
    if (!newSymptom.trim() || !authUser?.id) return;

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
                <h1 className="font-bold">Symptom Journal</h1>
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

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">AI Health Insights</h2>
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
          </div>
        )}

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
            {/* Tier Status */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="text-lg">Your Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentTier.color}`}></div>
                    <span className="font-medium">{currentTier.name}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {currentTier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {userProfile?.tier === 'community_advocate' && (
                    <Button className="w-full mt-4" variant="outline">
                      Upgrade Plan
                    </Button>
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
                  <Button variant="outline" className="w-full justify-start" onClick={() => alert('Family tracking not yet implemented!')}>
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
