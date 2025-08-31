import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Bell
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    tier: 'health_champion',
    joinDate: '2024-01-15',
    educationCompleted: true
  });
  
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [severity, setSeverity] = useState(1);
  const [aiInsights, setAiInsights] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
  };

  useEffect(() => {
    // Load user data and symptoms
    loadUserData();
    loadSymptoms();
    
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

  const loadUserData = async () => {
    // TODO: Load from Supabase
    // For now using mock data
  };

  const loadSymptoms = async () => {
    // TODO: Load from Supabase
    // Mock data for demonstration
    const mockSymptoms = [
      { id: 1, symptom: 'Headache', severity: 3, timestamp: '2024-01-20T10:00:00Z' },
      { id: 2, symptom: 'Fatigue', severity: 2, timestamp: '2024-01-19T14:30:00Z' },
      { id: 3, symptom: 'Nausea', severity: 1, timestamp: '2024-01-18T09:15:00Z' }
    ];
    setSymptoms(mockSymptoms);
    
    // Mock AI insights
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
  };

  const logSymptom = async () => {
    if (!newSymptom.trim()) return;

    const symptomData = {
      symptom: newSymptom,
      severity: severity,
      timestamp: new Date().toISOString()
    };

    if (isOnline) {
      try {
        // TODO: API call to log symptom
        // const response = await fetch('/api/log_symptom', { ... });
        
        // Add to local state
        const newSymptomEntry = {
          id: Date.now(),
          ...symptomData
        };
        setSymptoms(prev => [newSymptomEntry, ...prev]);
        
      } catch (error) {
        console.error('Failed to log symptom:', error);
        // Store offline for later sync
        storeOfflineSymptom(symptomData);
      }
    } else {
      // Store offline
      storeOfflineSymptom(symptomData);
    }

    setNewSymptom('');
    setSeverity(1);
    setShowLogForm(false);
  };

  const storeOfflineSymptom = (symptomData) => {
    const offline = JSON.parse(localStorage.getItem('offlineSymptoms') || '[]');
    offline.push(symptomData);
    localStorage.setItem('offlineSymptoms', JSON.stringify(offline));
    
    // Add to local state with pending flag
    const newSymptomEntry = {
      id: Date.now(),
      ...symptomData,
      pending: true
    };
    setSymptoms(prev => [newSymptomEntry, ...prev]);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const exportData = () => {
    if (user.tier === 'community_advocate') {
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

  const currentTier = tierFeatures[user.tier];

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
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
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
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
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
                    {user.tier !== 'community_advocate' && (
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

                  {user.tier === 'community_advocate' && (
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
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Family Tracking
                  </Button>
                  {user.tier !== 'community_advocate' && (
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
                <label className="text-sm font-medium">Symptom</label>
                <input 
                  type="text" 
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Headache, Fatigue, Nausea..."
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
                  onClick={logSymptom}
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