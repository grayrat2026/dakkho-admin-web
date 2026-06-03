'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, BookOpen, BarChart as BarChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { apiGet } from '@/lib/api-client';

const COLORS = ['#4A90E2', '#00D4AA', '#F59E0B', '#EF4444', '#8B5CF6'];

interface ChartData {
  enrollmentTrend: { month: string; enrollments: number }[];
  courseDistribution: { name: string; value: number }[];
  userGrowth: { month: string; users: number }[];
}

export default function AnalyticsPanel() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchChartData();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await apiGet('/analytics') as Record<string, unknown>;
      setStats((data.stats as Record<string, number>) || {});
    } catch { console.error('Failed to fetch analytics'); }
  };

  const fetchChartData = async () => {
    try {
      const data = await apiGet('/analytics/charts') as ChartData;
      setChartData(data);
    } catch {
      console.error('Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A2E] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-dakkho-teal">{payload[0].name || 'Value'}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const hasEnrollmentData = chartData && chartData.enrollmentTrend.some(d => d.enrollments > 0);
  const hasDistributionData = chartData && chartData.courseDistribution.some(d => d.value > 0);
  const hasUserGrowthData = chartData && chartData.userGrowth.some(d => d.users > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { title: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-blue-400' },
          { title: 'Total Courses', value: stats.totalCourses ?? 0, icon: BookOpen, color: 'text-emerald-400' },
          { title: 'Total Videos', value: stats.totalVideos ?? 0, icon: BarChart3, color: 'text-purple-400' },
          { title: 'Enrollments', value: stats.totalEnrollments ?? 0, icon: TrendingUp, color: 'text-amber-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="glass-card border-0">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.title}</p>
                    <p className={`text-xl md:text-2xl font-bold mt-1 ${item.color}`}>
                      {loading ? '...' : item.value.toLocaleString()}
                    </p>
                  </div>
                  <Icon className={`h-6 w-6 md:h-8 md:w-8 ${item.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card className="glass-card border-0">
          <CardHeader><CardTitle className="text-lg">Enrollment Trend</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-dakkho-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasEnrollmentData ? (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChartIcon className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No enrollment data yet</p>
                <p className="text-xs mt-1">Data will appear as students enroll in courses</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData?.enrollmentTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="enrollments" fill="#4A90E2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Course Distribution */}
        <Card className="glass-card border-0">
          <CardHeader><CardTitle className="text-lg">Course Level Distribution</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-dakkho-teal border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasDistributionData ? (
              <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChartIcon className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No course distribution data</p>
                <p className="text-xs mt-1">Data will appear when courses are created</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData?.courseDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(chartData?.courseDistribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {(chartData?.courseDistribution || []).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="glass-card border-0 lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-dakkho-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasUserGrowthData ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No user growth data yet</p>
                <p className="text-xs mt-1">Data will appear as users register on the platform</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="users" stroke="#00D4AA" strokeWidth={3} dot={{ r: 5, fill: '#00D4AA' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
