'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function UserNav() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-blue-100 p-2">
          <User className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-sm">
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-gray-500">{session?.user?.email}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
} 