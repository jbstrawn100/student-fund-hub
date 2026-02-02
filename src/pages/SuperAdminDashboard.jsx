import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Plus, Building2, MoreVertical, Users, FileText, DollarSign, Search, Eye, ExternalLink } from "lucide-react";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list("-created_date"),
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["allOrgRequests"],
    queryFn: () => base44.entities.FundRequest.list("-created_date", 1000),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allOrgUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organization.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["organizations"]),
  });

  const filteredOrgs = organizations.filter(org =>
    org.org_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOrgStats = (orgId) => {
    const orgRequests = allRequests.filter(r => r.organization_id === orgId);
    const orgUsers = allUsers.filter(u => u.organization_id === orgId);
    const totalDisbursed = orgRequests
      .filter(r => r.status === "Paid" || r.status === "Approved")
      .reduce((sum, r) => sum + (r.requested_amount || 0), 0);

    return {
      userCount: orgUsers.length,
      requestCount: orgRequests.length,
      totalDisbursed,
    };
  };

  const handleStatusToggle = (org) => {
    const newStatus = org.status === "active" ? "suspended" : "active";
    updateOrgMutation.mutate({ id: org.id, data: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Organization Management"
        description="Manage all organizations on the platform"
        actions={
          <Button
            onClick={() => navigate(createPageUrl("CreateOrganization"))}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Organization
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Organizations</CardTitle>
            <Building2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {organizations.filter(o => o.status === "active").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-slate-500 mt-1">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Requests</CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allRequests.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {allRequests.filter(r => r.status === "Submitted" || r.status === "In Review").length} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Total Disbursed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => {
                const stats = getOrgStats(org.id);
                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="font-medium">{org.org_name}</div>
                      <div className="text-xs text-slate-500">{org.contact_email}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        /org/{org.subdomain}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={org.status === "active" ? "default" : "secondary"}
                        className={
                          org.status === "active"
                            ? "bg-green-100 text-green-800"
                            : org.status === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }
                      >
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{stats.userCount}</TableCell>
                    <TableCell>{stats.requestCount}</TableCell>
                    <TableCell>${stats.totalDisbursed.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(createPageUrl(`OrganizationDetail?id=${org.id}`))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/org/${org.subdomain}`}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visit Portal
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(org)}>
                            {org.status === "active" ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}