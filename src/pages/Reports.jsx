import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, DollarSign, PieChart, TrendingUp, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const [user, setUser] = useState(null);
  const [selectedFund, setSelectedFund] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: requests = [] } = useQuery({
    queryKey: ["allRequests"],
    queryFn: () => base44.entities.FundRequest.list(),
  });

  const { data: funds = [] } = useQuery({
    queryKey: ["allFunds"],
    queryFn: () => base44.entities.Fund.list(),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ["allDisbursements"],
    queryFn: () => base44.entities.Disbursement.list("-paid_at"),
  });

  // Filter data
  const filteredRequests = requests.filter(r => {
    const fundMatch = selectedFund === "all" || r.fund_id === selectedFund;
    
    let dateMatch = true;
    if (dateRange !== "all" && r.submitted_at) {
      const submitDate = new Date(r.submitted_at);
      const now = new Date();
      if (dateRange === "30days") {
        dateMatch = (now - submitDate) <= 30 * 24 * 60 * 60 * 1000;
      } else if (dateRange === "90days") {
        dateMatch = (now - submitDate) <= 90 * 24 * 60 * 60 * 1000;
      } else if (dateRange === "year") {
        dateMatch = submitDate.getFullYear() === now.getFullYear();
      }
    }
    
    return fundMatch && dateMatch;
  });

  const filteredDisbursements = disbursements.filter(d => {
    return selectedFund === "all" || d.fund_id === selectedFund;
  });

  // Calculate stats
  const totalRequested = filteredRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0);
  const totalApproved = filteredRequests.filter(r => ["Approved", "Paid"].includes(r.status))
    .reduce((sum, r) => sum + (r.requested_amount || 0), 0);
  const totalDisbursed = filteredDisbursements.reduce((sum, d) => sum + (d.amount_paid || 0), 0);

  // Usage by category
  const usageByCategory = {};
  filteredRequests.forEach(r => {
    const category = r.intended_use_category || "Other";
    if (!usageByCategory[category]) {
      usageByCategory[category] = { count: 0, total: 0, disbursed: 0 };
    }
    usageByCategory[category].count++;
    usageByCategory[category].total += r.requested_amount || 0;
  });

  filteredDisbursements.forEach(d => {
    const request = requests.find(r => r.id === d.fund_request_id);
    if (request) {
      const category = request.intended_use_category || "Other";
      if (usageByCategory[category]) {
        usageByCategory[category].disbursed += d.amount_paid || 0;
      }
    }
  });

  // Export to CSV
  const exportToCSV = () => {
    const csvRows = [
      ["Request ID", "Student", "Fund", "Category", "Intended Use", "Amount Requested", "Status", "Amount Disbursed", "Submitted Date"]
    ];

    filteredRequests.forEach(r => {
      const requestDisbursements = disbursements.filter(d => d.fund_request_id === r.id);
      const totalPaid = requestDisbursements.reduce((sum, d) => sum + (d.amount_paid || 0), 0);
      
      csvRows.push([
        r.request_id || "",
        r.student_full_name || "",
        r.fund_name || "",
        r.intended_use_category || "",
        `"${(r.intended_use_description || "").replace(/"/g, '""')}"`,
        r.requested_amount || 0,
        r.status || "",
        totalPaid,
        r.submitted_at ? format(new Date(r.submitted_at), "yyyy-MM-dd") : ""
      ]);
    });

    const csv = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fund-requests-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

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
        description="Track fund usage and disbursements"
        actions={
          <Button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
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
                {funds.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.fund_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Requested</p>
              <DollarSign className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-2xl font-bold">${totalRequested.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">{filteredRequests.length} requests</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Approved</p>
              <TrendingUp className="w-5 h-5 text-emerald-200" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">${totalApproved.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">
              {((totalApproved / totalRequested) * 100 || 0).toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Disbursed</p>
              <FileText className="w-5 h-5 text-violet-200" />
            </div>
            <p className="text-2xl font-bold text-violet-600">${totalDisbursed.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">{filteredDisbursements.length} payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Category */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Usage by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Requested</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(usageByCategory)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell>
                      <Badge variant="secondary">{category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${data.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-violet-600 font-medium">
                      ${data.disbursed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {((data.total / totalRequested) * 100 || 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Disbursements */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle>Recent Disbursements</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDisbursements.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No disbursements yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Intended Use</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisbursements.slice(0, 10).map((d) => {
                  const request = requests.find(r => r.id === d.fund_request_id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.student_name}</TableCell>
                      <TableCell>{d.fund_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {request?.intended_use_category || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-slate-600">
                        {request?.intended_use_description || "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${d.amount_paid?.toLocaleString()}
                      </TableCell>
                      <TableCell>{format(new Date(d.paid_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{d.payment_method}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}