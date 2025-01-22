'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Users, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'Admin';

  return (
    <div className="flex h-full w-56 flex-col bg-gray-900">
      <div className="flex h-14 items-center border-b border-gray-700 px-4">
        <div className="flex items-center gap-2">
          <BarChart className="h-6 w-6 text-blue-500" />
          <h1 className="text-lg font-bold text-white">ReCustom</h1>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            pathname === '/dashboard'
              ? 'bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>

        {isAdmin && (
          <Link
            href="/users"
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
              pathname === '/users'
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Users className="h-5 w-5" />
            Users
          </Link>
        )}
      </nav>
    </div>
  );
} 