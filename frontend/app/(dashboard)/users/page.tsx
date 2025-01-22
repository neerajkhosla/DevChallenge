import UsersTable from '@/components/users/users-table';
import { BarChart } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart className="h-10 w-10 text-blue-500" />
        <h2 className="text-3xl font-bold">ReCustom User Metrics</h2>
      </div>
      <div className="container mx-auto">
        <UsersTable />
      </div>
    </div>
  );
} 