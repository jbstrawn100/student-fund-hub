import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  DollarSign,
  FileText,
  Calendar,
  Upload,
  CheckCircle,
  File,
  X,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AdvocateRequestDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get("id");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: request, isLoading } = useQuery({
    queryKey: ["fundRequest", requestId],
    queryFn: () => base44.entities.FundRequest.filter({ id: requestId }),
    select: (data) => data[0],
    enabled: !!requestId,
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const invalidFiles = files.filter(file => 
      !ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
    );

    if (invalidFiles.length > 0) {
      alert(`Some files are invalid. Please ensure all files are PDF, JPG, PNG, or DOC and under 10MB.`);
      return;
    }

    setUploading(true);
    const uploadedFiles = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedFiles.push({ 
        name: file.name, 
        url: file_url,
        type: file.type,
        uploaded_by: user.full_name,
        uploaded_by_role: "advocate",
        uploaded_at: new Date().toISOString()
      });
    }

    const updatedAttachments = [...(request.attachments || []), ...uploadedFiles];
    await base44.entities.FundRequest.update(request.id, {
      attachments: updatedAttachments
    });

    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: "ADVOCATE_UPLOADED_DOCUMENTS",
      entity_type: "FundRequest",
      entity_id: request.id,
      details: JSON.stringify({ 
        file_count: uploadedFiles.length,
        file_names: uploadedFiles.map(f => f.name)
      })
    });

    queryClient.invalidateQueries(["fundRequest", requestId]);
    setUploading(false);
    e.target.value = null;
  };

  const removeAttachment = async (index) => {
    const attachment = request.attachments[index];
    const updatedAttachments = request.attachments.filter((_, i) => i !== index);
    
    await base44.entities.FundRequest.update(request.id, {
      attachments: updatedAttachments
    });

    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: "ADVOCATE_REMOVED_DOCUMENT",
      entity_type: "FundRequest",
      entity_id: request.id,
      details: JSON.stringify({ file_name: attachment.name })
    });

    queryClient.invalidateQueries(["fundRequest", requestId]);
  };

  const handleCompleteTask = async () => {
    setSubmitting(true);

    await base44.entities.FundRequest.update(request.id, {
      advocate_tasks_completed: true
    });

    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: "ADVOCATE_COMPLETED_TASKS",
      entity_type: "FundRequest",
      entity_id: request.id,
      details: JSON.stringify({ request_id: request.request_id })
    });

    queryClient.invalidateQueries(["fundRequest", requestId]);
    setShowConfirmModal(false);
    setSubmitting(false);
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Request not found or you don't have access to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user is the assigned advocate
  if (request.advocate_user_id !== user.id) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            You are not assigned as the advocate for this request.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const advocateAttachments = (request.attachments || []).filter(
    att => att.uploaded_by_role === "advocate"
  );

  return (
    <div className="max-w-5xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl("AdvocateQueue"))}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Applications
      </Button>

      <PageHeader
        title={`Request ${request.request_id}`}
        description="Supporting this student's application"
      />

      {/* Task Status Banner */}
      {request.advocate_tasks_completed ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You have marked your tasks as complete for this application.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-800">
            Please upload any required supporting documents and confirm completion when done.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-medium">{request.student_full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <p className="font-medium">{request.student_email}</p>
              </div>
              {request.student_phone && (
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="font-medium">{request.student_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Fund</p>
                <p className="font-medium">{request.fund_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Requested Amount
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${request.requested_amount?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Category</p>
                <Badge>{request.intended_use_category}</Badge>
              </div>
              {request.intended_use_description && (
                <div>
                  <p className="text-sm text-slate-500">How Funds Will Be Used</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{request.intended_use_description}</p>
                </div>
              )}
              {request.justification_paragraph && (
                <div>
                  <p className="text-sm text-slate-500">Justification</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{request.justification_paragraph}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Upload any additional documents needed to support this application.
              </p>

              {!request.advocate_tasks_completed && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    id="advocateFileUpload"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="advocateFileUpload" className="cursor-pointer">
                    {uploading ? (
                      <LoadingSpinner size="sm" className="mx-auto mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-slate-600">
                      {uploading ? "Uploading..." : "Click to upload documents"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF, JPG, PNG, DOC • Max 10MB per file
                    </p>
                  </label>
                </div>
              )}

              {advocateAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Uploaded by You ({advocateAttachments.length})
                  </p>
                  {advocateAttachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{file.name}</p>
                          {file.uploaded_at && (
                            <p className="text-xs text-slate-500">
                              {format(new Date(file.uploaded_at), "MMM d, yyyy h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, "_blank")}
                          className="text-indigo-600"
                        >
                          View
                        </Button>
                        {!request.advocate_tasks_completed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(request.attachments.indexOf(file))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Tasks Button */}
          {!request.advocate_tasks_completed && (
            <Button
              onClick={() => setShowConfirmModal(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark Tasks as Complete
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={request.status} />
              {request.submitted_at && (
                <div className="mt-4 text-sm">
                  <p className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Submitted
                  </p>
                  <p className="font-medium">
                    {format(new Date(request.submitted_at), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">All Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 truncate">{file.name}</p>
                          {file.uploaded_by && (
                            <p className="text-xs text-slate-500">
                              by {file.uploaded_by_role === "advocate" ? "You" : file.uploaded_by}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, "_blank")}
                          className="text-indigo-600 text-xs p-1 h-auto"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Confirm Task Completion
            </DialogTitle>
            <DialogDescription>
              Are you sure you've completed all required tasks for this application?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800 text-sm">
                This will notify reviewers that you've finished your supporting work on this application.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteTask}
              disabled={submitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirm Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}