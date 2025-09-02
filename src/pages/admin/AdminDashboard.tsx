import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, Activity, TrendingUp, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  dailySymptoms: number;
  monthlyRevenue: number;
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    tier: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resource_type: string;
    created_at: string;
    user_email?: string;
  }>;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic stats
      const [
        { data: users, error: usersError },
        { data: subscriptions, error: subsError },
        { data: symptoms, error: symptomsError },
        { data: recentUsers, error: recentUsersError },
        { data: recentActivity, error: activityError }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('user_subscriptions').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('symptoms').select('*', { count: 'exact' }).gte('timestamp', new Date().toISOString().split('T')[0]),
        supabase.from('users').select('id, email, full_name, created_at, tier').order('created_at', { ascending: false }).limit(5),
        supabase.from('audit_logs').select(`
          id, action, resource_type, created_at,
          user_id,
          users!inner(email)
        `).order('created_at', { ascending: false }).limit(10)
      ]);

      if (usersError || subsError || symptomsError || recentUsersError || activityError) {
        throw new Error('Failed to load dashboard data');
      }

      // Calculate monthly revenue (mock data for now)
      const monthlyRevenue = (subscriptions?.length || 0) * 150; // Assuming average 150 KES per subscription

      setStats({
        totalUsers: users?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        dailySymptoms: symptoms?.length || 0,
        monthlyRevenue,
        recentUsers: recentUsers || [],
        recentActivity: (recentActivity || []).map(activity => ({
          ...activity,
          user_email: (activity as any).users?.email
        }))
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = async () => {
    try {
      const { error } = await supabase.rpc('update_system_metrics');
      if (error) throw error;
      
      // Reload dashboard after updating metrics
      await loadDashboardData();
    } catch (err) {
      console.error('Error updating metrics:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
          <Button onClick={updateMetrics} variant="outline" size="sm">
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Premium subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Symptoms</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dailySymptoms || 0}</div>
            <p className="text-xs text-muted-foreground">Logged today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats?.monthlyRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">Estimated this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.tier === 'community_advocate' ? 'secondary' : 'default'}>
                      {user.tier?.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{activity.action} {activity.resource_type}</p>
                    <p className="text-xs text-muted-foreground">{activity.user_email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;