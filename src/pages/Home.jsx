import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Wallet,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const userRole = user?.app_role || "student";
  const isStaff = ["reviewer", "approver", "fund_manager", "admin"].includes(userRole);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isStaff ? <StaffDashboard user={user} /> : <StudentDashboard user={user} />;
}

function StudentDashboard({ user }) {
  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ["myRequests", user.id],
    queryFn: () => base44.entities.FundRequest.filter({ student_user_id: user.id }),
  });

  const { data: activeFunds = [] } = useQuery({
    queryKey: ["activeFunds"],
    queryFn: () => base44.entities.Fund.filter({ status: "active" }),
  });

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter(r => ["Submitted", "In Review"].includes(r.status)).length,
    approved: myRequests.filter(r => r.status === "Approved" || r.status === "Paid").length,
    needsInfo: myRequests.filter(r => r.status === "Needs Info").length,
  };

  const recentRequests = [...myRequests]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.full_name?.split(" ")[0] || "Student"}`}
        description="Track your fund requests and apply for available funds"
        actions={
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25">
            <Link to={createPageUrl("Apply")}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Apply for Fund
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Needs Attention"
          value={stats.needsInfo}
          icon={AlertCircle}
          color="rose"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Requests */}
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl("MyRequests")} className="text-indigo-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner className="py-8" />
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No requests yet</p>
                <p className="text-sm">Apply for a fund to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    to={createPageUrl(`RequestDetail?id=${request.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate group-hover:text-indigo-600">
                        {request.fund_name || "Fund Request"}
                      </p>
                      <p className="text-sm text-slate-500">
                        ${request.requested_amount?.toLocaleString()} • {request.intended_use_category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={request.status} />
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Funds */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Available Funds</CardTitle>
          </CardHeader>
          <CardContent>
            {activeFunds.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No active funds</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeFunds.slice(0, 5).map((fund) => (
                  <Link
                    key={fund.id}
                    to={createPageUrl(`Apply?fund=${fund.id}`)}
                    className="block p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                  >
                    <p className="font-medium text-slate-800 group-hover:text-indigo-600">
                      {fund.fund_name}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {fund.description || "No description available"}
                    </p>
                    {fund.end_date && (
                      <p className="text-xs text-slate-400 mt-2">
                        Deadline: {format(new Date(fund.end_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StaffDashboard({ user }) {
  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ["allRequests"],
    queryFn: () => base44.entities.FundRequest.list("-created_date"),
  });

  const { data: funds = [] } = useQuery({
    queryKey: ["allFunds"],
    queryFn: () => base44.entities.Fund.list(),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ["disbursements"],
    queryFn: () => base44.entities.Disbursement.list(),
  });

  const stats = {
    pendingReview: allRequests.filter(r => ["Submitted", "In Review"].includes(r.status)).length,
    approved: allRequests.filter(r => r.status === "Approved").length,
    totalDisbursed: disbursements.reduce((sum, d) => sum + (d.amount_paid || 0), 0),
    activeFunds: funds.filter(f => f.status === "active").length,
  };

  const pendingRequests = allRequests
    .filter(r => ["Submitted", "In Review", "Needs Info"].includes(r.status))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.full_name?.split(" ")[0] || "Staff"}`}
        description="Overview of fund requests and disbursements"
        actions={
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
            <Link to={createPageUrl("Queue")}>
              View Queue <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          color="amber"
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
          color="violet"
        />
        <StatCard
          title="Active Funds"
          value={stats.activeFunds}
          icon={Wallet}
          color="blue"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Requests */}
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Requests Needing Attention</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl("Queue")} className="text-indigo-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner className="py-8" />
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                <p>All caught up!</p>
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <Link
                    key={request.id}
                    to={createPageUrl(`ReviewRequest?id=${request.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate group-hover:text-indigo-600">
                        {request.student_full_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {request.fund_name} • ${request.requested_amount?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={request.status} />
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fund Overview */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Fund Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl("Funds")} className="text-indigo-600">
                Manage
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {funds.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No funds created</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funds.slice(0, 5).map((fund) => (
                  <div
                    key={fund.id}
                    className="p-3 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-800">{fund.fund_name}</p>
                      <StatusBadge status={fund.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Budget</span>
                      <span className="font-medium">${fund.total_budget?.toLocaleString()}</span>
                    </div>
                    {fund.remaining_budget !== undefined && (
                      <div className="mt-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            style={{
                              width: `${Math.min(100, ((fund.remaining_budget || 0) / fund.total_budget) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          ${fund.remaining_budget?.toLocaleString()} remaining
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}