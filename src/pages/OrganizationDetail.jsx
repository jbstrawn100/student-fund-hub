import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import PageHeader from "@/components/shared/PageHeader";
import { ArrowLeft, Save, Users, FileText, Wallet, BarChart3, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function OrganizationDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get("id");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0];
    },
    enabled: !!orgId,
  });

  const { data: orgUsers = [] } = useQuery({
    queryKey: ["orgUsers", orgId],
    queryFn: () => base44.entities.User.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: orgRequests = [] } = useQuery({
    queryKey: ["orgRequests", orgId],
    queryFn: () => base44.entities.FundRequest.filter({ organization_id: orgId }, "-created_date"),
    enabled: !!orgId,
  });

  const { data: orgFunds = [] } = useQuery({
    queryKey: ["orgFunds", orgId],
    queryFn: () => base44.entities.Fund.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: orgDisbursements = [] } = useQuery({
    queryKey: ["orgDisbursements", orgId],
    queryFn: () => base44.entities.Disbursement.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  useEffect(() => {
    if (org) {
      setFormData(org);
    }
  }, [org]);

  const updateOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["organization", orgId]);
      setEditMode(false);
    },
  });

  const handleSave = () => {
    updateOrgMutation.mutate(formData);
  };

  if (isLoading || !org) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalDisbursed = orgDisbursements.reduce((sum, d) => sum + d.amount_paid, 0);
  const activeFunds = orgFunds.filter(f => f.status === "active").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl("SuperAdminDashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <PageHeader
        title={org.org_name}
        description={`app.com/${org.subdomain}`}
        actions={
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} variant="outline">
                Edit Organization
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Users</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Funds</CardTitle>
            <Wallet className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgFunds.length}</div>
            <p className="text-xs text-slate-500 mt-1">{activeFunds} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Requests</CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Disbursed</CardTitle>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDisbursed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="users">Users ({orgUsers.length})</TabsTrigger>
          <TabsTrigger value="funds">Funds ({orgFunds.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({orgRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input
                      value={formData.org_name}
                      onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subdomain *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={formData.subdomain}
                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                        className="flex-1"
                      />
                      <span className="text-slate-500">.app.com</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email || ""}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      type="tel"
                      value={formData.contact_phone || ""}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={formData.logo_url || ""}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-500">URL Path</Label>
                    <p className="mt-1 font-mono text-sm bg-slate-100 px-3 py-2 rounded">
                      app.com/{org.subdomain}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Contact Email</Label>
                    <p className="mt-1">{org.contact_email || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Contact Phone</Label>
                    <p className="mt-1">{org.contact_phone || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Address</Label>
                    <p className="mt-1">{org.address || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Status</Label>
                    <div className="mt-1">
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>
                        {org.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-500">Created</Label>
                    <p className="mt-1">{format(new Date(org.created_date), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.staff_role || user.role}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(user.created_date), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funds">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund Name</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgFunds.map((fund) => (
                    <TableRow key={fund.id}>
                      <TableCell className="font-medium">{fund.fund_name}</TableCell>
                      <TableCell>${fund.total_budget?.toLocaleString()}</TableCell>
                      <TableCell>${fund.remaining_budget?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={fund.status === "active" ? "default" : "secondary"}>
                          {fund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{fund.fund_owner_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgRequests.slice(0, 50).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">{request.request_id}</TableCell>
                      <TableCell>{request.student_full_name}</TableCell>
                      <TableCell>{request.fund_name}</TableCell>
                      <TableCell>${request.requested_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge>{request.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {request.submitted_at
                          ? format(new Date(request.submitted_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}