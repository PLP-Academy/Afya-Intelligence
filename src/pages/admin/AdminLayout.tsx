import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import AdminGuard from '@/components/AdminGuard';

const AdminLayout = () => {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <main className="flex-1">
            <header className="h-12 flex items-center border-b bg-background">
              <SidebarTrigger className="ml-2" />
              <h1 className="ml-4 text-lg font-semibold text-foreground">Admin Panel</h1>
            </header>
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default AdminLayout;