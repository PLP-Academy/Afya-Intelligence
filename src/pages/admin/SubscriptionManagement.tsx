import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Edit, RefreshCw, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  cancelled_at: string | null;
  cancel_at_period_end: boolean;
  user_email?: string;
  user_name?: string;
}

interface SubscriptionStats {
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  newSubscriptions: number;
}

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadSubscriptions(), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user data separately if needed
      const subscriptionsWithUserData = await Promise.all(
        (data || []).map(async (sub) => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('email, full_name')
              .eq('id', sub.user_id)
              .single();

            return {
              ...sub,
              user_email: userData?.email,
              user_name: userData?.full_name
            };
          } catch (err) {
            // If user lookup fails, show the user_id instead
            return {
              ...sub,
              user_email: `User: ${sub.user_id.slice(0, 8)}...`,
              user_name: null
            };
          }
        })
      );

      setSubscriptions(subscriptionsWithUserData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      // Calculate subscription stats
      const activeCount = subscriptions.filter(sub => sub.status === 'active').length;
      const totalRevenue = activeCount * 150; // Approximate revenue calculation
      
      // Calculate new subscriptions this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newThisMonth = subscriptions.filter(sub => 
        new Date(sub.created_at) >= thisMonth
      ).length;

      // Simple churn rate calculation (cancelled / total)
      const cancelledCount = subscriptions.filter(sub => sub.cancelled_at).length;
      const churnRate = subscriptions.length > 0 ? (cancelledCount / subscriptions.length) * 100 : 0;

      setStats({
        totalRevenue,
        activeSubscriptions: activeCount,
        churnRate: Math.round(churnRate * 100) / 100,
        newSubscriptions: newThisMonth
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const updateSubscription = async (subscriptionId: string, updates: {
    status?: string;
    tier?: 'community_advocate' | 'health_champion' | 'global_advocate';
    cancel_at_period_end?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, ...updates } : sub
      ));

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    await updateSubscription(subscriptionId, {
      status: 'cancelled',
      cancel_at_period_end: true
    });
  };

  const reactivateSubscription = async (subscriptionId: string) => {
    await updateSubscription(subscriptionId, {
      status: 'active',
      cancel_at_period_end: false
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      (sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesTier = filterTier === 'all' || sub.tier === filterTier;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'cancelled': return 'destructive';
      case 'paused': return 'secondary';
      default: return 'outline';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'global_advocate': return 'default';
      case 'health_champion': return 'secondary';
      default: return 'outline';
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsEditDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!editingSubscription) return;

    await updateSubscription(editingSubscription.id, {
      status: editingSubscription.status,
      tier: editingSubscription.tier as 'community_advocate' | 'health_champion' | 'global_advocate',
      cancel_at_period_end: editingSubscription.cancel_at_period_end
    });

    setIsEditDialogOpen(false);
    setEditingSubscription(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">Monitor and manage user subscriptions</p>
        </div>
        <Button onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From active subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Currently paying users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.churnRate}%</div>
              <p className="text-xs text-muted-foreground">Subscription cancellation rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newSubscriptions}</div>
              <p className="text-xs text-muted-foreground">New subscriptions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Subscriptions</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by user email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tier</Label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="health_champion">Champion</SelectItem>
                  <SelectItem value="global_advocate">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>All user subscriptions and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscription.user_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{subscription.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTierBadgeVariant(subscription.tier)}>
                      {subscription.tier?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(subscription.status)}>
                      {subscription.status}
                    </Badge>
                    {subscription.cancel_at_period_end && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        Ends at period
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p>Start: {new Date(subscription.current_period_start).toLocaleDateString()}</p>
                      <p>End: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditSubscription(subscription)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {subscription.status === 'active' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelSubscription(subscription.id)}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => reactivateSubscription(subscription.id)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details and settings
            </DialogDescription>
          </DialogHeader>
          {editingSubscription && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editingSubscription.status} 
                  onValueChange={(value) => setEditingSubscription({
                    ...editingSubscription,
                    status: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select 
                  value={editingSubscription.tier} 
                  onValueChange={(value) => setEditingSubscription({
                    ...editingSubscription,
                    tier: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_champion">Health Champion</SelectItem>
                    <SelectItem value="global_advocate">Global Advocate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubscription}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
