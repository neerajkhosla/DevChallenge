'use client';
import { useState, useEffect } from 'react';
import { UserDialog } from './user-dialog';
import { toast } from '@/components/ui/use-toast';
import { UserCircle2, Trash2, Search, Filter, Users, Shield, FileDown, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RoleStats {
  total: number;
  admin: number;
  user: number;
}

interface UserActivity {
  activity_type: string;
  activity_timestamp: string;
  details: string;
}

interface UserActivitySummary {
  activity_type: string;
  activity_count: number;
  last_updated: string;
}

const ITEMS_PER_PAGE = 5;

function StatsCard({ title, count, icon: Icon, bgColor, textColor, isActive, onClick }: { 
  title: string;
  count: number;
  icon: any;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`${bgColor} rounded-lg p-6 flex items-center justify-between shadow-md transition-all cursor-pointer
        ${isActive ? 'ring-4 ring-offset-2 ring-blue-500 scale-105' : 'hover:scale-105'}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-100 opacity-80">{title}</p>
        <p className={`text-2xl font-bold ${textColor} mt-1`}>{count}</p>
      </div>
      <div className={`${textColor} opacity-80`}>
        <Icon className="h-8 w-8" />
      </div>
    </div>
  );
}

export default function UsersTable() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Admin' | 'User'>('all');
  const [roleStats, setRoleStats] = useState<RoleStats>({
    total: 0,
    admin: 0,
    user: 0
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = [...users];
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply role filter
    if (activeFilter !== 'all') {
      result = result.filter(user => user.role === activeFilter);
    }
    
    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, activeFilter, users]);

  useEffect(() => {
    const stats = {
      total: users.length,
      admin: users.filter(user => user.role === 'Admin').length,
      user: users.filter(user => user.role === 'User').length
    };
    setRoleStats(stats);
  }, [users]);

  const handleDelete = async (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await fetch(`http://localhost:3001/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      fetchUsers();
      
      // Adjust current page if necessary after deletion
      const newTotalPages = Math.ceil((users.length - 1) / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages) {
        setCurrentPage(Math.max(1, newTotalPages));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDownloadPDF = async (userId: string, userName: string) => {
    try {
      // Show loading toast
      toast({
        title: 'Downloading...',
        description: 'Generating your PDF report',
      });

      const response = await fetch(`http://localhost:3001/api/users/${userId}/activity-pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Convert the response to blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `${userName.toLowerCase().replace(/\s+/g, '-')}-activity-report.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'PDF report downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF report',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Users</h2>
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <UserCircle2 className="h-5 w-5" />
            Add User
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            count={roleStats.total}
            icon={Users}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            textColor="text-blue-50"
            isActive={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          <StatsCard
            title="Admin Users"
            count={roleStats.admin}
            icon={Shield}
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            textColor="text-purple-50"
            isActive={activeFilter === 'Admin'}
            onClick={() => setActiveFilter('Admin')}
          />
          <StatsCard
            title="Normal Users"
            count={roleStats.user}
            icon={UserCircle2}
            bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
            textColor="text-emerald-50"
            isActive={activeFilter === 'User'}
            onClick={() => setActiveFilter('User')}
          />
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-100">
          <div className="min-w-full">
            <div className="bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-[1fr,1.5fr,1fr,auto] px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">Name</div>
                <div className="text-sm font-semibold text-gray-900">Email</div>
                <div className="text-sm font-semibold text-gray-900">Role</div>
                <div className="text-sm font-semibold text-gray-900">Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-[1fr,1.5fr,1fr,auto] px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${
                        user.role === 'Admin' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <UserCircle2 className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                        user.role === 'Admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {user.role === 'Admin' ? <Shield className="h-3.5 w-3.5" /> : <UserCircle2 className="h-3.5 w-3.5" />}
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {user.id !== session?.user?.id && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(user.id, user.name)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors group"
                        title="Download Activity Report"
                      >
                        <FileDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No users found matching your criteria
                </div>
              )}
            </div>
          </div>
          {filteredUsers.length > ITEMS_PER_PAGE && (
            <div className="border-t border-gray-100">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
                  <span className="font-medium">{filteredUsers.length}</span> {activeFilter === 'all' ? 'users' : `${activeFilter.toLowerCase()} users`}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md border ${
                      currentPage === 1
                        ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1.5 rounded-md border ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md border ${
                      currentPage === totalPages
                        ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <UserDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          user={editingUser}
          onSuccess={() => {
            fetchUsers();
            handleDialogClose();
          }}
        />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 