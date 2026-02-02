import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import PageHeader from "@/components/shared/PageHeader";
import { Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    org_name: "",
    subdomain: "",
    logo_url: "",
    primary_color: "#4f46e5",
    contact_email: "",
    contact_phone: "",
    address: "",
    status: "active"
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.org_name || !formData.subdomain) {
      alert("Organization name and subdomain are required");
      return;
    }

    setSubmitting(true);

    const orgData = {
      org_name: formData.org_name,
      subdomain: formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      logo_url: formData.logo_url || null,
      primary_color: formData.primary_color,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      address: formData.address || null,
      status: formData.status,
      settings: {}
    };

    const newOrg = await base44.entities.Organization.create(orgData);
    navigate(createPageUrl(`OrganizationDetail?id=${newOrg.id}`));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl("SuperAdminDashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Create New Organization"
        description="Set up a new organization on the platform"
      />

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Configure organization settings and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input
                placeholder="e.g., Acme University"
                value={formData.org_name}
                onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL Path *</Label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">/</span>
                <Input
                  placeholder="acme"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-slate-500">
                Organization will be accessible at: /{formData.subdomain || 'path'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  placeholder="admin@acme.edu"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                placeholder="Street, City, State, ZIP"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                placeholder="https://..."
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Primary Brand Color</Label>
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
                  placeholder="#4f46e5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link to={createPageUrl("SuperAdminDashboard")}>Cancel</Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.org_name || !formData.subdomain}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Create Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}