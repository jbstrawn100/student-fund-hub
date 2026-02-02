import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import PageHeader from "@/components/shared/PageHeader";
import FieldSelector from "@/components/funds/FieldSelector";
import CategoryManager from "@/components/funds/CategoryManager";
import { DollarSign, Save, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrganization } from "@/components/OrganizationContext";
import { useOrgPrefix } from "@/components/useOrgFilter";

const DEFAULT_CATEGORIES = [
  "Tuition/Fees", "Books/Supplies", "Housing", "Food",
  "Transportation", "Medical", "Technology", "Other"
];

const DEFAULT_FIELDS = [
  { id: "student_full_name", label: "Full Name", required: true },
  { id: "student_email", label: "Email", required: true },
  { id: "student_phone", label: "Phone Number", required: false },
  { id: "requested_amount", label: "Requested Amount", required: true },
  { id: "intended_use_category", label: "Use Category", required: true },
  { id: "intended_use_description", label: "Use Description", required: true },
  { id: "justification_paragraph", label: "Justification", required: true },
  { id: "attachments", label: "File Attachments", required: false }
];

export default function CreateFund() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const orgPrefix = useOrgPrefix();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fund_name: "",
    description: "",
    eligibility_notes: "",
    start_date: "",
    end_date: "",
    total_budget: "",
    max_request_amount: "",
    requires_attachments: false,
    allowed_categories: [],
    custom_categories: DEFAULT_CATEGORIES,
    application_fields: DEFAULT_FIELDS,
    budget_enforcement: "warn",
    status: "active"
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const toggleCategory = (category) => {
    if (formData.allowed_categories.includes(category)) {
      setFormData({
        ...formData,
        allowed_categories: formData.allowed_categories.filter(c => c !== category)
      });
    } else {
      setFormData({
        ...formData,
        allowed_categories: [...formData.allowed_categories, category]
      });
    }
  };

  const handleFieldsChange = (fields) => {
    setFormData({ ...formData, application_fields: fields });
  };

  const handleCategoriesChange = (categories) => {
    setFormData({ ...formData, custom_categories: categories });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const fundData = {
      organization_id: organization.id,
      fund_name: formData.fund_name,
      description: formData.description,
      eligibility_notes: formData.eligibility_notes,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      total_budget: parseFloat(formData.total_budget),
      remaining_budget: parseFloat(formData.total_budget),
      max_request_amount: formData.max_request_amount ? parseFloat(formData.max_request_amount) : null,
      requires_attachments: formData.requires_attachments,
      allowed_categories: formData.allowed_categories.length > 0 ? formData.allowed_categories : null,
      custom_categories: formData.custom_categories,
      application_fields: formData.application_fields,
      budget_enforcement: formData.budget_enforcement,
      status: formData.status,
      fund_owner_id: user.id,
      fund_owner_name: user.full_name
    };

    const newFund = await base44.entities.Fund.create(fundData);

    await base44.entities.AuditLog.create({
      organization_id: organization.id,
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: "FUND_CREATED",
      entity_type: "Fund",
      entity_id: newFund.id,
      details: JSON.stringify({ 
        fund_name: formData.fund_name,
        total_budget: formData.total_budget,
        start_date: formData.start_date,
        end_date: formData.end_date
      })
    });

    navigate(orgPrefix + createPageUrl(`FundDetail?id=${newFund.id}`));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={orgPrefix + createPageUrl("Funds")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Funds
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Create New Fund"
        description="Set up a new fund for student assistance"
      />

      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle>Fund Details</CardTitle>
          <CardDescription>Configure fund settings and constraints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Basic Information</h3>
            
            <div className="space-y-2">
              <Label>Fund Name *</Label>
              <Input
                placeholder="e.g., Emergency Assistance Fund"
                value={formData.fund_name}
                onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the purpose and goals of this fund..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Eligibility Notes</Label>
              <Textarea
                placeholder="Specify eligibility requirements..."
                rows={2}
                value={formData.eligibility_notes}
                onChange={(e) => setFormData({ ...formData, eligibility_notes: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Budget Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-slate-800">Budget Settings</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Budget *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    className="pl-9"
                    placeholder="0.00"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Budget Enforcement</Label>
                <Select
                  value={formData.budget_enforcement}
                  onValueChange={(value) => setFormData({ ...formData, budget_enforcement: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No restrictions)</SelectItem>
                    <SelectItem value="warn">Warn (Show warning)</SelectItem>
                    <SelectItem value="block">Block (Prevent approval)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Application Form Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-slate-800">Application Form Configuration</h3>
            
            <FieldSelector
              selectedFields={formData.application_fields}
              onFieldsChange={handleFieldsChange}
            />

            <CategoryManager
              categories={formData.custom_categories}
              onCategoriesChange={handleCategoriesChange}
            />

            <div className="space-y-2">
              <Label>Restrict to Specific Categories (Optional)</Label>
              <p className="text-xs text-slate-500 mb-2">
                Leave empty to allow all categories defined above
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.custom_categories.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`justify-start ${
                      formData.allowed_categories.includes(category)
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                        : ""
                    }`}
                    onClick={() => toggleCategory(category)}
                  >
                    {formData.allowed_categories.includes(category) ? (
                      <CheckCircle className="w-3 h-3 mr-2" />
                    ) : (
                      <div className="w-3 h-3 mr-2 rounded border-2 border-slate-300" />
                    )}
                    <span className="text-xs">{category.split("/")[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Maximum Request Amount (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  className="pl-9"
                  placeholder="No limit"
                  value={formData.max_request_amount}
                  onChange={(e) => setFormData({ ...formData, max_request_amount: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link to={orgPrefix + createPageUrl("Funds")}>Cancel</Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.fund_name || !formData.total_budget}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Create Fund
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}