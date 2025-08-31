import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Heart, 
  Settings, 
  Shield, 
  CreditCard, 
  Bell, 
  Globe, 
  Download,
  Upload,
  Trash2,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState({
    id: '12345',
    email: 'john@example.com',
    username: 'johndoe',
    fullName: 'John Doe',
    tier: 'health_champion',
    educationCompleted: true,
    dataSharingConsent: true,
    impactNotifications: true,
    createdAt: '2024-01-15T10:00:00Z',
    subscriptionEnd: '2024-02-15T10:00:00Z'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const tierInfo = {
    community_advocate: {
      name: 'Community Advocate',
      price: 'Free',
      color: 'bg-blue-500',
      features: ['30-day history', 'Basic AI', 'Education modules'],
      nextTier: 'health_champion'
    },
    health_champion: {
      name: 'Health Champion',
      price: '$1/month',
      color: 'bg-green-500', 
      features: ['Unlimited history', 'Advanced AI', 'Weekly reports', 'Data export'],
      nextTier: 'global_advocate'
    },
    global_advocate: {
      name: 'Global Advocate',
      price: '$3/month',
      color: 'bg-purple-500',
      features: ['All features', 'Family tracking', 'Expert consultations', 'Research participation'],
      nextTier: null
    }
  };

  const subscriptionStats = {
    totalContributions: 847,
    impactPoints: 1234,
    educationProgress: 100,
    dataPoints: 456,
    communityRank: 'Top 15%'
  };

  useEffect(() => {
    // Load user data
    loadUserProfile();
    
    // Dark mode
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const loadUserProfile = async () => {
    // TODO: Load from Supabase
    // For now using mock data
  };

  const saveProfile = async () => {
    try {
      // TODO: Save to Supabase
      // const response = await fetch('/api/user_profile', { ... });
      
      setUser({ ...editData });
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const upgradeTier = async (newTier) => {
    try {
      // TODO: Call upgrade API
      // const response = await fetch('/api/upgrade', { ... });
      
      // For demo, just update locally
      setUser(prev => ({ ...prev, tier: newTier }));
      setShowUpgradeModal(false);
      alert('Tier upgraded successfully!');
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
      alert('Failed to upgrade tier. Please try again.');
    }
  };

  const exportAllData = async () => {
    try {
      // TODO: Call export API
      // const response = await fetch('/api/export_data', { ... });
      
      // Mock CSV generation
      const csvContent = `Personal Data Export - Symptom Journal
Generated: ${new Date().toISOString()}

User Information:
Name: ${user.fullName}
Email: ${user.email}
Tier: ${tierInfo[user.tier].name}
Member Since: ${new Date(user.createdAt).toLocaleDateString()}

Account Settings:
Data Sharing Consent: ${user.dataSharingConsent ? 'Yes' : 'No'}
Impact Notifications: ${user.impactNotifications ? 'Yes' : 'No'}
Education Completed: ${user.educationCompleted ? 'Yes' : 'No'}

Statistics:
Total Contributions: ${subscriptionStats.totalContributions}
Impact Points: ${subscriptionStats.impactPoints}
Data Points Shared: ${subscriptionStats.dataPoints}
Community Rank: ${subscriptionStats.communityRank}`;

      const blob = new Blob([csvContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'symptom-journal-data-export.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const deleteAccount = async () => {
    try {
      // TODO: Call delete API
      // const response = await fetch('/api/delete_account', { ... });
      
      alert('Account deletion initiated. You will receive a confirmation email.');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const currentTier = tierInfo[user.tier];
  const nextTier = currentTier.nextTier ? tierInfo[currentTier.nextTier] : null;

  return (
    <div className="min-h-screen bg-background">
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
                <p className="text-xs text-muted-foreground">Profile</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button 
                onClick={toggleDarkMode}
                variant="ghost" 
                size="sm"
                className="p-2"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                Dashboard
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
                      Dashboard
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
              <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
              <p className="text-muted-foreground">
                Manage your account, privacy settings, and subscription.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={exportAllData}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="health-button"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...user });
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveProfile}
                    className="health-button"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your basic account information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editData.fullName}
                        onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div className="text-sm">{user.fullName}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editData.username}
                        onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div className="text-sm">@{user.username}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="text-sm">{user.email}</div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Data Sharing
                </CardTitle>
                <CardDescription>
                  Control how your data is used to improve global health outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Anonymous Data Sharing</div>
                    <div className="text-sm text-muted-foreground">
                      Share anonymized symptom patterns to help researchers identify health trends
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="dataSharing"
                      checked={isEditing ? editData.dataSharingConsent : user.dataSharingConsent}
                      onChange={(e) => isEditing && setEditData(prev => ({ ...prev, dataSharingConsent: e.target.checked }))}
                      disabled={!isEditing}
                      className="rounded border-input"
                    />
                    <label htmlFor="dataSharing" className="text-sm">
                      {user.dataSharingConsent ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Impact Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive updates about how your contributions help achieve SDG 3 goals
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notifications"
                      checked={isEditing ? editData.impactNotifications : user.impactNotifications}
                      onChange={(e) => isEditing && setEditData(prev => ({ ...prev, impactNotifications: e.target.checked }))}
                      disabled={!isEditing}
                      className="rounded border-input"
                    />
                    <label htmlFor="notifications" className="text-sm">
                      {user.impactNotifications ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All personal data is encrypted and stored securely. We never share identifying information without your explicit consent.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <div className="font-medium">Delete Account</div>
                      <div className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Subscription */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${currentTier.color}`}></div>
                    <div>
                      <div className="font-medium">{currentTier.name}</div>
                      <div className="text-sm text-muted-foreground">{currentTier.price}</div>
                    </div>
                  </div>

                  {user.tier !== 'community_advocate' && (
                    <div className="text-sm">
                      <div className="text-muted-foreground">Next billing:</div>
                      <div>{new Date(user.subscriptionEnd).toLocaleDateString()}</div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Features:</div>
                    {currentTier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {nextTier && (
                    <Button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full mt-4 health-button"
                    >
                      Upgrade to {nextTier.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Impact Statistics */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Your Impact
                </CardTitle>
                <CardDescription>
                  How you're contributing to SDG 3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Contributions</span>
                    <span className="font-semibold text-primary">{subscriptionStats.totalContributions}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Impact Points</span>
                    <span className="font-semibold text-primary">{subscriptionStats.impactPoints}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Points Shared</span>
                    <span className="font-semibold text-primary">{subscriptionStats.dataPoints}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Community Rank</span>
                    <span className="font-semibold text-primary">{subscriptionStats.communityRank}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Education Progress</div>
                    <Progress value={subscriptionStats.educationProgress} />
                    <div className="text-xs text-muted-foreground mt-1">
                      {subscriptionStats.educationProgress}% Complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Education:</span>
                    <span className="flex items-center gap-1">
                      {user.educationCompleted ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Complete
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          Incomplete
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && nextTier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upgrade to {nextTier.name}</CardTitle>
                <Button 
                  onClick={() => setShowUpgradeModal(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Unlock advanced features and increase your global health impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{nextTier.price}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">You'll get:</div>
                  {nextTier.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => setShowUpgradeModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => upgradeTier(nextTier.name.toLowerCase().replace(' ', '_'))}
                  className="flex-1 health-button"
                >
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <Button 
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                This action cannot be undone. All your data will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-destructive">
                <Trash2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This will permanently delete:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>All your symptom data</li>
                    <li>Your education progress</li>
                    <li>Your subscription and billing history</li>
                    <li>Your impact statistics</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type "DELETE" to confirm:
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={deleteAccount}
                  variant="destructive"
                  className="flex-1"
                >
                  Delete Forever
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;