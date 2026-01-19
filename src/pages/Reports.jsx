import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Wallet,
  Users
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

export default function Reports() {
  const [user, setUser] = useState(null);
  const [selectedFund, setSelectedFund] = useState("all");
  const [dateRange, setDateRange] = useState("6months");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["allRequests"],
    queryFn: () => base44.entities.FundRequest.list("-created_date"),
  });

  const { data: funds = [] } = useQuery({
    queryKey: ["allFunds"],
    queryFn: () => base44.entities.Fund.list(),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ["allDisbursements"],
    queryFn: () => base44.entities.Disbursement.list("-created_date"),
  });

  // Filter by fund
  const filteredRequests = selectedFund === "all" 
    ? requests 
    : requests.filter(r => r.fund_id === selectedFund);

  const filteredDisbursements = selectedFund === "all"
    ? disbursements
    : disbursements.filter(d => d.fund_id === selectedFund);

  // Date range filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "1month": return subMonths(now, 1);
      case "3months": return subMonths(now, 3);
      case "6months": return subMonths(now, 6);
      case "1year": return subMonths(now, 12);
      default: return subMonths(now, 6);
    }
  };

  const startDate = getDateRange();
  const dateFilteredRequests = filteredRequests.filter(r => 
    new Date(r.created_date) >= startDate
  );

  // Calculate stats
  const stats = {
    totalRequests: dateFilteredRequests.length,
    totalAmount: dateFilteredRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0),
    approved: dateFilteredRequests.filter(r => ["Approved", "Paid", "Closed"].includes(r.status)).length,
    pending: dateFilteredRequests.filter(r => ["Submitted", "In Review", "Needs Info"].includes(r.status)).length,
    totalDisbursed: filteredDisbursements.reduce((sum, d) => sum + (d.amount_paid || 0), 0),
    avgRequestAmount: dateFilteredRequests.length > 0 
      ? dateFilteredRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0) / dateFilteredRequests.length 
      : 0
  };

  // Status distribution for pie chart
  const statusData = [
    { name: "Approved", value: dateFilteredRequests.filter(r => r.status === "Approved").length, color: "#22c55e" },
    { name: "Paid", value: dateFilteredRequests.filter(r => r.status === "Paid").length, color: "#8b5cf6" },
    { name: "In Review", value: dateFilteredRequests.filter(r => r.status === "In Review").length, color: "#f59e0b" },
    { name: "Submitted", value: dateFilteredRequests.filter(r => r.status === "Submitted").length, color: "#3b82f6" },
    { name: "Needs Info", value: dateFilteredRequests.filter(r => r.status === "Needs Info").length, color: "#f97316" },
    { name: "Denied", value: dateFilteredRequests.filter(r => r.status === "Denied").length, color: "#ef4444" },
  ].filter(s => s.value > 0);

  // Category distribution for bar chart
  const categoryData = [
    "Tuition/Fees", "Books/Supplies", "Housing", "Food", 
    "Transportation", "Medical", "Technology", "Other"
  ].map(cat => ({
    category: cat.split("/")[0],
    count: dateFilteredRequests.filter(r => r.intended_use_category === cat).length,
    amount: dateFilteredRequests.filter(r => r.intended_use_category === cat)
      .reduce((sum, r) => sum + (r.requested_amount || 0), 0)
  })).filter(c => c.count > 0);

  // Monthly trend data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    
    const monthRequests = filteredRequests.filter(r => {
      const date = new Date(r.created_date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    const monthDisbursements = filteredDisbursements.filter(d => {
      const date = new Date(d.created_date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    monthlyData.push({
      month: format(monthStart, "MMM"),
      requests: monthRequests.length,
      amount: monthRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0),
      disbursed: monthDisbursements.reduce((sum, d) => sum + (d.amount_paid || 0), 0)
    });
  }

  // Fund distribution
  const fundData = funds.map(fund => ({
    name: fund.fund_name,
    requests: requests.filter(r => r.fund_id === fund.id).length,
    budget: fund.total_budget || 0,
    remaining: fund.remaining_budget || fund.total_budget || 0
  }));

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Track fund request metrics and trends"
      />

      {/* Filters */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>{fund.fund_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loadingRequests ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Requests"
              value={stats.totalRequests}
              icon={FileText}
              color="indigo"
            />
            <StatCard
              title="Amount Requested"
              value={`$${stats.totalAmount.toLocaleString()}`}
              icon={DollarSign}
              color="violet"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Total Disbursed"
              value={`$${stats.totalDisbursed.toLocaleString()}`}
              icon={TrendingUp}
              color="blue"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        name="Requests"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Amount ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg">Requests by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="category" type="category" stroke="#94a3b8" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fund Overview */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg">Fund Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fundData.slice(0, 5).map((fund, index) => (
                    <div key={fund.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{fund.name}</span>
                        <span className="text-sm text-slate-500">{fund.requests} requests</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (fund.remaining / fund.budget) * 100)}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>${fund.remaining.toLocaleString()} remaining</span>
                        <span>${fund.budget.toLocaleString()} budget</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-indigo-600">
                    ${Math.round(stats.avgRequestAmount).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Avg Request Amount</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-emerald-600">
                    {stats.totalRequests > 0 ? Math.round((stats.approved / stats.totalRequests) * 100) : 0}%
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Approval Rate</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-violet-600">
                    {funds.filter(f => f.status === "active").length}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Active Funds</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600">
                    {stats.pending}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}