'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, UserCog, User, BarChart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  BarChart as BarChartComponent,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  normalUsers: number;
}

interface UserActivity {
  name: string;
  downloads: number;
  logins: number;
  totalActivity: number;
}

interface ActivitySummary {
  activity_type: string;
  activity_count: number;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon,
  color 
}: { 
  title: string; 
  value: number; 
  icon: any;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    normalUsers: 0,
  });
  const [activityData, setActivityData] = useState<UserActivity[]>([]);
  const [userActivity, setUserActivity] = useState<ActivitySummary[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('http://localhost:3001/api/users');
        const users = await usersResponse.json();
        
        const adminUsers = users.filter((user: any) => user.role === 'Admin').length;
        const normalUsers = users.filter((user: any) => user.role === 'User').length;
        
        setStats({
          totalUsers: users.length,
          adminUsers,
          normalUsers,
        });

        // Fetch activity data for each user
        const activityPromises = users.map(async (user: any) => {
          const activityResponse = await fetch(`http://localhost:3001/api/users/${user.id}/activity`);
          const activityData = await activityResponse.json();
          
          // Count downloads and logins from activitySummary
          const downloads = activityData.activitySummary?.find(
            (summary: ActivitySummary) => summary.activity_type === 'pdf_download'
          )?.activity_count || 0;
          
          const logins = activityData.activitySummary?.find(
            (summary: ActivitySummary) => summary.activity_type === 'login'
          )?.activity_count || 0;

          return {
            name: user.name,
            downloads,
            logins,
            totalActivity: downloads + logins,
          };
        });

        const transformedData = await Promise.all(activityPromises);
        // Sort by total activity and get top 5 users with non-zero activity
        const topUsers = transformedData
          .filter(user => user.totalActivity > 0)
          .sort((a, b) => b.totalActivity - a.totalActivity)
          .slice(0, 5);
        setActivityData(topUsers);
      } catch (error) {
        console.error('Failed to fetch user statistics:', error);
        toast.error('Failed to fetch user statistics');
      }
    };

    const fetchUserActivity = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`http://localhost:3001/api/users/${session.user.id}/activity`);
          const data = await response.json();
          setUserActivity(data.activitySummary || []);
        } catch (error) {
          console.error('Failed to fetch user activity:', error);
          toast.error('Failed to fetch user activity');
        }
      }
    };

    if (session?.user?.role === 'Admin') {
      fetchStats();
    }
    fetchUserActivity();
  }, [session]);

  const handleDownloadReport = async () => {
    if (!session?.user?.id) return;

    try {
      toast('Generating your PDF report');

      const response = await fetch(
        `http://localhost:3001/api/users/${session.user.id}/activity-pdf`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to generate PDF');

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-report-${session.user.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BarChart className="h-10 w-10 text-blue-500" />
          <h2 className="text-3xl font-bold">Metrics Dashboard</h2>
        </div>
        <Button
          onClick={handleDownloadReport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download My Report
        </Button>
      </div>

      {session?.user?.role === 'Admin' ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Admin Users"
              value={stats.adminUsers}
              icon={UserCog}
              color="bg-purple-500"
            />
            <StatCard
              title="Normal Users"
              value={stats.normalUsers}
              icon={User}
              color="bg-green-500"
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Top 5 Most Active Users</h3>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChartComponent data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px' }}
                    formatter={(value: number, name: string) => {
                      const label = name === 'downloads' ? 'Downloads' : 'Logins';
                      return [value, label];
                    }}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <Bar 
                    dataKey="downloads" 
                    fill="#3b82f6" 
                    name="downloads"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="logins" 
                    fill="#8b5cf6" 
                    name="logins"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">My Activity Summary</h3>
            <div className="h-[300px] max-w-2xl mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChartComponent data={userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="activity_type" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    dataKey="activity_count" 
                    fill="#3b82f6" 
                    name="Activity Count"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 