import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  Info,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

// Removed subscription service imports - keeping only user profile functionality

// Declare IntaSend on the Window interface
declare global {
  interface Window {
    IntaSend?: (config: { publicAPIKey: string; live: boolean }) => {
      on: (event: string, callback: (result: any) => void) => any;
    };
  }
}

const INTASEND_PUBLISHABLE_KEY = import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY || ""; // Use environment variable

const Profile = () => {
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    id: authUser?.id || '12345',
    email: authUser?.email || 'john@example.com',
    username: authUser?.user_metadata?.username || 'johndoe',
    fullName: authUser?.user_metadata?.full_name || 'John Doe',
    tier: (authUser?.user_metadata?.tier || 'community_advocate') as 'community_advocate' | 'health_champion' | 'global_advocate',
    educationCompleted: authUser?.user_metadata?.education_completed || false,
    dataSharingConsent: authUser?.user_metadata?.data_sharing_consent || false,
    impactNotifications: authUser?.user_metadata?.impact_notifications || false,
    createdAt: authUser?.created_at || '2024-01-15T10:00:00Z',
    subscriptionEnd: authUser?.user_metadata?.subscription_end || '2024-02-15T10:00:00Z'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Removed subscription and payment related state

  // Removed currency conversion and tier information - now handled in Dashboard/ Pricing pages

  useEffect(() => {
    if (authUser) {
      setUser(prev => ({
        ...prev,
        id: authUser.id,
        email: authUser.email || '',
        username: authUser.user_metadata?.username || prev.username,
        fullName: authUser.user_metadata?.full_name || prev.fullName,
        tier: (authUser.user_metadata?.tier || 'community_advocate') as 'community_advocate' | 'health_champion' | 'global_advocate',
        educationCompleted: authUser.user_metadata?.education_completed || prev.educationCompleted,
        dataSharingConsent: authUser.user_metadata?.data_sharing_consent || prev.dataSharingConsent,
        impactNotifications: authUser.user_metadata?.impact_notifications || prev.impactNotifications,
        createdAt: authUser.created_at || prev.createdAt,
        subscriptionEnd: authUser.user_metadata?.subscription_end || prev.subscriptionEnd
      }));
    }
    
    // Load user data
    loadUserProfile();
  
    // Dark mode
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    // Removed IntaSend initialization - now handled in Dashboard/Pricing pages
  }, [authUser]); // Only depend on authUser to avoid infinite loops

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

  // The upgradeTier function is no longer directly called by a button,
  // as IntaSend handles the payment initiation. The tier update logic
  // is now within the IntaSend COMPLETE event handler.
  // Keeping it here as a placeholder if direct upgrade logic is needed elsewhere.
  const upgradeTier = async (newTier: 'community_advocate' | 'health_champion' | 'global_advocate') => {
    try {
      // TODO: Call upgrade API (e.g., to update Supabase backend)
      // const response = await fetch('/api/upgrade', { ... });
      
      // For demo, just update locally
      setUser(prev => ({ ...prev, tier: newTier }));
      alert('Tier updated successfully!');
    } catch (error) {
      console.error('Failed to update tier:', error);
      alert('Failed to update tier. Please try again.');
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
Member Since: ${new Date(user.createdAt).toLocaleDateString()}

Account Settings:
Data Sharing Consent: ${user.dataSharingConsent ? 'Yes' : 'No'}
Impact Notifications: ${user.impactNotifications ? 'Yes' : 'No'}
Education Completed: ${user.educationCompleted ? 'Yes' : 'No'}`;

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
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
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
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    onClick={toggleDarkMode}
                    variant="ghost" 
                    size="sm"
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                      Dashboard
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

        <div className="max-w-4xl mx-auto grid gap-6">
          {/* Profile Content */}
          <div className="space-y-6 w-full">
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
                        aria-label="Full Name"
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
                        aria-label="Username"
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

            {/* Current Subscription */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="font-medium">{user.tier || 'Community Advocate'}</div>
                        <div className="text-sm text-muted-foreground">Current subscription</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => navigate('/pricing')}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Manage Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Want to upgrade your plan or change payment methods? Visit the pricing page to view all available options.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

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
                  aria-label="Confirm delete by typing DELETE"
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
