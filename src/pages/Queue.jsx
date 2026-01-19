import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  DollarSign,
  User,
  Clock
} from "lucide-react";
import { format } from "date-fns";

export default function Queue() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [fundFilter, setFundFilter] = useState("all");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["allRequests"],
    queryFn: () => base44.entities.FundRequest.list("-created_date"),
  });

  const { data: funds = [] } = useQuery({
    queryKey: ["allFunds"],
    queryFn: () => base44.entities.Fund.list(),
  });

  const getStatusGroup = (status) => {
    if (["Submitted", "In Review", "Needs Info"].includes(status)) return "pending";
    if (["Approved", "Paid"].includes(status)) return "approved";
    if (status === "Denied") return "denied";
    if (status === "Draft") return "draft";
    return "closed";
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.student_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fund_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.intended_use_category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || getStatusGroup(request.status) === statusFilter;
    const matchesFund = fundFilter === "all" || request.fund_id === fundFilter;
    
    return matchesSearch && matchesStatus && matchesFund;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => getStatusGroup(r.status) === "pending").length,
    approved: requests.filter(r => getStatusGroup(r.status) === "approved").length,
    denied: requests.filter(r => getStatusGroup(r.status) === "denied").length,
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
        title="Review Queue"
        description="Review and process fund requests"
      />

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-white/70 border">
          <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Approved ({statusCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="denied" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Denied ({statusCounts.denied})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by student or fund..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={fundFilter} onValueChange={setFundFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>{fund.fund_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No Requests Found"
            description="No requests match your current filters."
          />
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden divide-y">
              {filteredRequests.map((request) => (
                <Link
                  key={request.id}
                  to={createPageUrl(`ReviewRequest?id=${request.id}`)}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">{request.student_full_name}</p>
                      <p className="text-sm text-slate-500">{request.fund_name}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {request.requested_amount?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(request.created_date), "MMM d")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="group hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium">{request.student_full_name}</p>
                            <p className="text-xs text-slate-500">{request.student_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{request.fund_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100">
                          {request.intended_use_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">${request.requested_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {request.submitted_at
                            ? format(new Date(request.submitted_at), "MMM d, yyyy")
                            : format(new Date(request.created_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={createPageUrl(`ReviewRequest?id=${request.id}`)}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}