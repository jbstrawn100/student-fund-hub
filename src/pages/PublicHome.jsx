import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useDataFilter } from "@/components/useDataFilter";
import { useAuth } from "@/components/AuthContext";
import {
  Wallet,
  Calendar,
  DollarSign,
  FileText,
  LogIn,
  UserPlus,
  Search
} from "lucide-react";
import { format } from "date-fns";

export default function PublicHome() {
  const dataFilter = useDataFilter();
  const { organization } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const { data: activeFunds = [], isLoading } = useQuery({
    queryKey: ["publicFunds", dataFilter],
    queryFn: () => base44.entities.Fund.filter({ ...(dataFilter || {}), status: "active" }),
    enabled: dataFilter !== null,
  });

  const filteredFunds = activeFunds.filter(fund =>
    fund.fund_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isStaff = user && ["reviewer", "approver", "fund_manager", "admin"].includes(user.app_role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.org_name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-800 text-lg">
                  {organization?.org_name || "Student Funds"}
                </h1>
                <p className="text-xs text-slate-500">Financial Assistance Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {isStaff && (
                    <Button asChild variant="outline">
                      <Link to={createPageUrl("DashboardHome")}>
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link to={createPageUrl("Account")}>
                      My Account
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => base44.auth.redirectToLogin(window.location.pathname)}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Available Funds
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse our available financial assistance funds and apply for support
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search funds by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Funds Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredFunds.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {searchTerm ? "No funds found" : "No active funds"}
            </h3>
            <p className="text-slate-500">
              {searchTerm ? "Try adjusting your search" : "Check back later for new opportunities"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFunds.map((fund) => (
              <Card key={fund.id} className="bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{fund.fund_name}</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {fund.description || "No description available"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {fund.total_budget && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total Budget
                        </span>
                        <span className="font-semibold">${fund.total_budget.toLocaleString()}</span>
                      </div>
                    )}
                    {fund.max_request_amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Max Request</span>
                        <span className="font-medium">${fund.max_request_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {fund.end_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Deadline
                        </span>
                        <span className="font-medium">{format(new Date(fund.end_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                    <Link to={createPageUrl(`Apply?fund=${fund.id}`)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Apply Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}