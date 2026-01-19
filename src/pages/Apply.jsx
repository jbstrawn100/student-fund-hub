import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Upload,
  X,
  FileText,
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Send,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

const USE_CATEGORIES = [
  "Tuition/Fees",
  "Books/Supplies",
  "Housing",
  "Food",
  "Transportation",
  "Medical",
  "Technology",
  "Other"
];

export default function Apply() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedFund, setSelectedFund] = useState(null);
  const [formData, setFormData] = useState({
    requested_amount: "",
    intended_use_category: "",
    intended_use_description: "",
    justification_paragraph: "",
    attachments: []
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
    checkUrlParams();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fundId = urlParams.get("fund");
    if (fundId) {
      setSelectedFund({ id: fundId });
    }
  };

  const { data: funds = [], isLoading } = useQuery({
    queryKey: ["activeFunds"],
    queryFn: () => base44.entities.Fund.filter({ status: "active" }),
  });

  useEffect(() => {
    if (selectedFund?.id && funds.length > 0) {
      const fund = funds.find(f => f.id === selectedFund.id);
      if (fund) {
        setSelectedFund(fund);
        setStep(2);
      }
    }
  }, [funds, selectedFund?.id]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push({ name: file.name, url: file_url });
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...uploadedUrls]
    }));
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (saveAsDraft = false) => {
    setSubmitting(true);

    const requestData = {
      fund_id: selectedFund.id,
      fund_name: selectedFund.fund_name,
      student_user_id: user.id,
      student_full_name: user.full_name,
      student_email: user.email,
      student_phone: user.phone || "",
      requested_amount: parseFloat(formData.requested_amount),
      intended_use_category: formData.intended_use_category,
      intended_use_description: formData.intended_use_description,
      justification_paragraph: formData.justification_paragraph,
      attachments: formData.attachments.map(a => a.url),
      status: saveAsDraft ? "Draft" : "Submitted",
      submitted_at: saveAsDraft ? null : new Date().toISOString()
    };

    await base44.entities.FundRequest.create(requestData);

    // Create audit log
    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: saveAsDraft ? "REQUEST_DRAFTED" : "REQUEST_SUBMITTED",
      entity_type: "FundRequest",
      entity_id: selectedFund.id,
      details: JSON.stringify({ fund_name: selectedFund.fund_name, amount: formData.requested_amount })
    });

    navigate(createPageUrl("MyRequests"));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Apply for Fund"
        description="Submit a request for financial assistance"
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[
            { num: 1, label: "Select Fund" },
            { num: 2, label: "Request Details" },
            { num: 3, label: "Review & Submit" }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s.num
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-slate-800" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 ${step > s.num ? "bg-indigo-600" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Select Fund */}
      {step === 1 && (
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSpinner className="py-16" />
          ) : funds.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No Active Funds"
              description="There are no funds currently accepting applications. Please check back later."
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {funds.map((fund) => (
                <Card
                  key={fund.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedFund?.id === fund.id
                      ? "ring-2 ring-indigo-600 border-indigo-600"
                      : "hover:border-indigo-200"
                  }`}
                  onClick={() => setSelectedFund(fund)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{fund.fund_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {fund.description || "No description available"}
                        </CardDescription>
                      </div>
                      {selectedFund?.id === fund.id && (
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {fund.eligibility_notes && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                          <span className="text-slate-600">{fund.eligibility_notes}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-slate-500 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${fund.total_budget?.toLocaleString()}</span>
                        </div>
                        {fund.end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Ends {format(new Date(fund.end_date), "MMM d")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedFund && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Request Details */}
      {step === 2 && (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Applying for: <span className="font-medium text-slate-800">{selectedFund?.fund_name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Requested Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className="pl-9"
                    value={formData.requested_amount}
                    onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Intended Use Category *</Label>
                <Select
                  value={formData.intended_use_category}
                  onValueChange={(value) => setFormData({ ...formData, intended_use_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {USE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="useDescription">How will you use these funds? *</Label>
              <Textarea
                id="useDescription"
                placeholder="Describe specifically how you plan to use these funds..."
                rows={4}
                value={formData.intended_use_description}
                onChange={(e) => setFormData({ ...formData, intended_use_description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why you need this financial assistance and how it will help you..."
                rows={4}
                value={formData.justification_paragraph}
                onChange={(e) => setFormData({ ...formData, justification_paragraph: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Supporting Documents</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="fileUpload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  {uploading ? (
                    <LoadingSpinner size="sm" className="mx-auto mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-slate-600">Click to upload documents</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, Images, or Documents</p>
                </label>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-2 mt-4">
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-slate-700">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.requested_amount || !formData.intended_use_category || !formData.intended_use_description || !formData.justification_paragraph}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                Review <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Review Your Application</CardTitle>
            <CardDescription>Please review all information before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Fund</p>
                  <p className="font-medium text-slate-800">{selectedFund?.fund_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Applicant</p>
                  <p className="font-medium text-slate-800">{user.full_name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Requested Amount</p>
                  <p className="font-medium text-2xl text-slate-800">
                    ${parseFloat(formData.requested_amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium text-slate-800">{formData.intended_use_category}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-slate-500 mb-2">Intended Use Description</p>
              <p className="text-slate-700">{formData.intended_use_description}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-slate-500 mb-2">Justification</p>
              <p className="text-slate-700">{formData.justification_paragraph}</p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm text-slate-500 mb-2">Attachments ({formData.attachments.length})</p>
                <div className="flex flex-wrap gap-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="px-3 py-1 bg-slate-100 rounded-lg text-sm">
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Edit
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}