import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Building2, Plus, Pencil, Upload } from "lucide-react";

export default function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
    description: "",
    welcome_message: "",
    status: "active"
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list("-created_date"),
  });

  const saveOrganization = useMutation({
    mutationFn: (data) => {
      if (editingOrg) {
        return base44.entities.Organization.update(editingOrg.id, data);
      } else {
        return base44.entities.Organization.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["organizations"]);
      setShowDialog(false);
      resetForm();
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, logo: file_url });
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveOrganization.mutate(formData);
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingOrg(null);
    setShowDialog(true);
  };

  const openEditDialog = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      logo: org.logo || "",
      description: org.description || "",
      welcome_message: org.welcome_message || "",
      status: org.status
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      logo: "",
      description: "",
      welcome_message: "",
      status: "active"
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user.is_super_admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Access restricted to Super Administrators</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-600" />
                Super Admin Dashboard
              </h1>
              <p className="mt-1 text-slate-500">Manage organizations and system-wide settings</p>
            </div>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </div>

        {/* Organizations List */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner className="py-8" />
            ) : organizations.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No organizations yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {org.logo ? (
                            <img src={org.logo} alt={org.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-purple-600" />
                            </div>
                          )}
                          <span>{org.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">{org.slug}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-slate-600 line-clamp-2">{org.description || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={org.status} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(org.created_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(org)}>
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOrg ? "Edit Organization" : "Create Organization"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme University"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (URL identifier) *</Label>
                <Input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="acme-university"
                />
                <p className="text-xs text-slate-500">
                  Public URL: /publichome?org={formData.slug || "org-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo && (
                    <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveOrganization.isPending} className="bg-purple-600 hover:bg-purple-700">
                  {saveOrganization.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  {editingOrg ? "Update" : "Create"} Organization
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}