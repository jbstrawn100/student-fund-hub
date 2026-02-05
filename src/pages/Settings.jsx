import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, Check, X, Mail } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    organization_name: "",
    organization_logo: "",
    organization_description: "",
    welcome_message: ""
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      const allSettings = await base44.entities.AppSettings.list();
      return allSettings[0];
    },
  });

  const { data: accessRequests = [] } = useQuery({
    queryKey: ["accessRequests"],
    queryFn: () => base44.entities.AccessRequest.list("-created_date"),
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        organization_name: settings.organization_name || "",
        organization_logo: settings.organization_logo || "",
        organization_description: settings.organization_description || "",
        welcome_message: settings.welcome_message || ""
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.AppSettings.update(settings.id, data);
      } else {
        return base44.entities.AppSettings.create({ ...data, is_singleton: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["appSettings"]);
      alert("Settings saved successfully!");
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, organization_logo: file_url });
    setUploading(false);
  };

  const handleSave = () => {
    saveSettings.mutate(formData);
  };

  const updateAccessRequest = useMutation({
    mutationFn: ({ id, status, notes }) => 
      base44.entities.AccessRequest.update(id, {
        status,
        reviewed_by: user.full_name,
        reviewed_at: new Date().toISOString(),
        notes
      }),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(["accessRequests"]);
      
      // Send notification email
      const request = accessRequests.find(r => r.id === variables.id);
      if (request && variables.status === "approved") {
        await base44.integrations.Core.SendEmail({
          to: request.email,
          subject: "Access Request Approved",
          body: `Dear ${request.full_name},\n\nYour access request has been approved! You can now sign in to submit fund applications.\n\nBest regards,\n${formData.organization_name || "Student Funds Team"}`
        });
      }
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user.app_role !== "admin") {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Access restricted to administrators</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Settings"
        description="Manage organization settings and access requests"
      />

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="access">
            Access Requests
            {accessRequests.filter(r => r.status === "pending").length > 0 && (
              <Badge className="ml-2 bg-red-500">
                {accessRequests.filter(r => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Organization Name *</Label>
                <Input
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  placeholder="Acme University"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.organization_logo && (
                    <img src={formData.organization_logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && <LoadingSpinner size="sm" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={formData.organization_description}
                  onChange={(e) => setFormData({ ...formData, organization_description: e.target.value })}
                  placeholder="Brief description shown on the public page..."
                />
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Input
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder="Welcome! Request access to get started."
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saveSettings.isPending || !formData.organization_name}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saveSettings.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Requests */}
        <TabsContent value="access">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle>Student Access Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner className="py-8" />
              ) : accessRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No access requests yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.full_name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{request.email}</p>
                              {request.phone && <p className="text-slate-500">{request.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{request.student_id || "-"}</TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-slate-600 line-clamp-2">{request.reason}</p>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {format(new Date(request.created_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={request.status} />
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAccessRequest.mutate({ id: request.id, status: "approved" })}
                                  disabled={updateAccessRequest.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAccessRequest.mutate({ id: request.id, status: "denied" })}
                                  disabled={updateAccessRequest.isPending}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Deny
                                </Button>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500">
                                {request.reviewed_by && (
                                  <p>By {request.reviewed_by}</p>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}