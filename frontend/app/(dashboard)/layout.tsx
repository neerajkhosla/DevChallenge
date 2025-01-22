import Sidebar from '@/components/sidebar';
import { Toaster } from '@/components/ui/toaster';
import UserNav from '@/components/layout/user-nav';

export const metadata = {
  title: 'ReCustom User Metrics',
  description: 'Track and analyze user activity metrics',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="flex justify-end p-4">
          <UserNav />
        </div>
        {children}
        <Toaster />
      </main>
    </div>
  );
} 