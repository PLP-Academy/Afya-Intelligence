import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const AdminGuard = ({ children, requireSuperAdmin = false }: AdminGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, [user, requireSuperAdmin]);

  const checkAdminAccess = async () => {
    if (authLoading) return;
    
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin access:', error);
        setHasAccess(false);
      } else {
        const role = profile?.role || 'user';
        setUserRole(role);
        
        if (requireSuperAdmin) {
          setHasAccess(role === 'super_admin');
        } else {
          setHasAccess(role === 'admin' || role === 'super_admin');
        }
      }
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            {!user 
              ? "Please log in to access the admin panel."
              : requireSuperAdmin
                ? `Super admin access required. Current role: ${userRole}`
                : `Admin access required. Current role: ${userRole}`
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;