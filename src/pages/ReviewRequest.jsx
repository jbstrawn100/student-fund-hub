import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  Calendar,
  DollarSign,
  User,
  Send,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Upload
} from "lucide-react";
import { format } from "date-fns";

export default function ReviewRequest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [reviewComments, setReviewComments] = useState("");
  const [decision, setDecision] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [disbursementData, setDisbursementData] = useState({
    amount_paid: "",
    payment_method: "",
    notes: "",
    receipt_upload: ""
  });

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
    queryFn: () => base44.entities.FundRequest.filter({ id: requestId }).then(res => res[0]),
    enabled: !!requestId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", requestId],
    queryFn: () => base44.entities.Review.filter({ fund_request_id: requestId }, "-created_date"),
    enabled: !!requestId,
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ["disbursements", requestId],
    queryFn: () => base44.entities.Disbursement.filter({ fund_request_id: requestId }),
    enabled: !!requestId,
  });

  const { data: fund } = useQuery({
    queryKey: ["fund", request?.fund_id],
    queryFn: () => base44.entities.Fund.filter({ id: request.fund_id }).then(res => res[0]),
    enabled: !!request?.fund_id,
  });

  const submitReview = async () => {
    setSubmitting(true);

    // Check budget before approving
    if (decision === "Approved" && fund) {
      const approvedRequests = await base44.entities.FundRequest.filter({ 
        fund_id: fund.id, 
        status: "Approved" 
      });
      const committedAmount = approvedRequests.reduce((sum, r) => sum + (r.requested_amount || 0), 0);
      
      const fundDisbursements = await base44.entities.Disbursement.filter({ fund_id: fund.id });
      const paidAmount = fundDisbursements.reduce((sum, d) => sum + (d.amount_paid || 0), 0);
      
      const remaining = fund.total_budget - paidAmount - committedAmount;
      
      if (remaining < request.requested_amount) {
        if (fund.budget_enforcement === "block") {
          alert(`Cannot approve: Insufficient budget. Remaining: $${remaining.toLocaleString()}, Requested: $${request.requested_amount.toLocaleString()}`);
          setSubmitting(false);
          return;
        } else if (fund.budget_enforcement === "warn") {
          if (!confirm(`Warning: This approval will exceed the remaining budget by $${(request.requested_amount - remaining).toLocaleString()}. Continue?`)) {
            setSubmitting(false);
            return;
          }
        }
      }
    }

    const newStatus = decision === "Approved" ? "Approved" 
                    : decision === "Denied" ? "Denied"
                    : decision === "Needs Info" ? "Needs Info"
                    : "In Review";

    // Create review record
    await base44.entities.Review.create({
      fund_request_id: requestId,
      reviewer_user_id: user.id,
      reviewer_name: user.full_name,
      step_name: `Review by ${user.app_role}`,
      decision: decision,
      comments: reviewComments,
      decided_at: new Date().toISOString()
    });

    // Update request status and lock if not "Needs Info"
    await base44.entities.FundRequest.update(requestId, {
      status: newStatus,
      locked: decision !== "Needs Info"
    });

    // Create audit log
    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: `REVIEW_${decision.toUpperCase().replace(" ", "_")}`,
      entity_type: "FundRequest",
      entity_id: requestId,
      details: JSON.stringify({ decision, comments: reviewComments })
    });

    queryClient.invalidateQueries(["fundRequest", requestId]);
    queryClient.invalidateQueries(["reviews", requestId]);
    setReviewComments("");
    setDecision("");
    setSubmitting(false);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDisbursementData({ ...disbursementData, receipt_upload: file_url });
  };

  const submitDisbursement = async () => {
    setSubmitting(true);

    await base44.entities.Disbursement.create({
      fund_request_id: requestId,
      fund_id: request.fund_id,
      fund_name: request.fund_name,
      student_name: request.student_full_name,
      amount_paid: parseFloat(disbursementData.amount_paid),
      paid_at: new Date().toISOString(),
      payment_method: disbursementData.payment_method,
      notes: disbursementData.notes,
      receipt_upload: disbursementData.receipt_upload
    });

    // Update request status to Paid
    await base44.entities.FundRequest.update(requestId, {
      status: "Paid"
    });

    // Update fund remaining budget
    if (fund) {
      const newRemaining = (fund.remaining_budget || fund.total_budget) - parseFloat(disbursementData.amount_paid);
      await base44.entities.Fund.update(fund.id, {
        remaining_budget: newRemaining
      });
    }

    // Create audit log
    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: "DISBURSEMENT_CREATED",
      entity_type: "Disbursement",
      entity_id: requestId,
      details: JSON.stringify(disbursementData)
    });

    queryClient.invalidateQueries(["fundRequest", requestId]);
    queryClient.invalidateQueries(["disbursements", requestId]);
    setShowDisbursementModal(false);
    setSubmitting(false);
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Request not found</p>
        <Button asChild className="mt-4">
          <Link to={createPageUrl("Queue")}>Back to Queue</Link>
        </Button>
      </div>
    );
  }

  const canReview = ["Submitted", "In Review"].includes(request.status);
  const canDisburse = request.status === "Approved" && ["fund_manager", "admin"].includes(user.app_role);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl("Queue")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Link>
        </Button>
      </div>

      {/* Header Card */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-100 text-sm mb-1">
                <User className="w-4 h-4" />
                {request.student_full_name}
              </div>
              <h1 className="text-2xl font-bold">{request.fund_name}</h1>
              <p className="text-indigo-100 mt-1">{request.intended_use_category}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-indigo-100 text-sm">Requested Amount</p>
                <p className="text-3xl font-bold">${request.requested_amount?.toLocaleString()}</p>
              </div>
              <StatusBadge status={request.status} className="bg-white/20 border-white/30 text-white" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-medium">{request.student_full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{request.student_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{request.student_phone || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-2">Intended Use Description</p>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">{request.intended_use_description}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Justification</p>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">{request.justification_paragraph}</p>
              </div>
              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Attachments</p>
                  <div className="space-y-2">
                    {request.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-indigo-700 flex-1">Attachment {index + 1}</span>
                        <ExternalLink className="w-4 h-4 text-indigo-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity / Reviews */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Review History</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const decisionColors = {
                      Approved: "text-emerald-600 bg-emerald-50 border-emerald-200",
                      Denied: "text-red-600 bg-red-50 border-red-200",
                      "Needs Info": "text-amber-600 bg-amber-50 border-amber-200",
                      Pending: "text-blue-600 bg-blue-50 border-blue-200"
                    };
                    const DecisionIcon = review.decision === "Approved" ? CheckCircle
                                       : review.decision === "Denied" ? XCircle
                                       : review.decision === "Needs Info" ? AlertCircle
                                       : Clock;
                    return (
                      <div key={review.id} className={`p-4 rounded-xl border ${decisionColors[review.decision]}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white">
                            <DecisionIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{review.reviewer_name}</span>
                              <span className="text-sm opacity-60">{review.step_name}</span>
                            </div>
                            <p className="text-sm opacity-60 mb-2">
                              {format(new Date(review.created_date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {review.comments && (
                              <p className="bg-white/50 p-3 rounded-lg">{review.comments}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review Action */}
          {canReview && (
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg">Submit Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Approve
                        </span>
                      </SelectItem>
                      <SelectItem value="Denied">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" /> Deny
                        </span>
                      </SelectItem>
                      <SelectItem value="Needs Info">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" /> Request More Info
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    placeholder="Add your review comments..."
                    rows={4}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  />
                </div>
                <Button
                  onClick={submitReview}
                  disabled={!decision || submitting}
                  className={`w-full ${
                    decision === "Approved" ? "bg-emerald-600 hover:bg-emerald-700" :
                    decision === "Denied" ? "bg-red-600 hover:bg-red-700" :
                    decision === "Needs Info" ? "bg-amber-600 hover:bg-amber-700" :
                    "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Review
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Disbursement Action */}
          {canDisburse && (
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Ready for Disbursement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-700 text-sm mb-4">
                  This request has been approved. You can now process the payment.
                </p>
                <Button
                  onClick={() => {
                    setDisbursementData({ ...disbursementData, amount_paid: request.requested_amount.toString() });
                    setShowDisbursementModal(true);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Fund Info */}
          {fund && (
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg">Fund Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Fund Name</p>
                  <p className="font-medium">{fund.fund_name}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Budget</span>
                  <span className="font-semibold">${fund.total_budget?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining</span>
                  <span className="font-semibold text-emerald-600">
                    ${(fund.remaining_budget || fund.total_budget)?.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{
                        width: `${Math.min(100, ((fund.remaining_budget || fund.total_budget) / fund.total_budget) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disbursement Info */}
          {disbursements.length > 0 && (
            <Card className="bg-violet-50 border-violet-200">
              <CardHeader>
                <CardTitle className="text-lg text-violet-800">Payment Complete</CardTitle>
              </CardHeader>
              <CardContent>
                {disbursements.map((d) => (
                  <div key={d.id} className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-violet-600">Amount Paid</span>
                      <span className="font-bold text-violet-800">${d.amount_paid?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-violet-600">Method</span>
                      <span className="text-violet-800">{d.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-violet-600">Date</span>
                      <span className="text-violet-800">{format(new Date(d.paid_at), "MMM d, yyyy")}</span>
                    </div>
                    {d.receipt_upload && (
                      <a
                        href={d.receipt_upload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-violet-600 hover:text-violet-800"
                      >
                        <FileText className="w-4 h-4" />
                        View Receipt
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submitted Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Created</p>
                  <p className="font-medium">{format(new Date(request.created_date), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>
              {request.submitted_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Send className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-slate-500">Submitted</p>
                    <p className="font-medium">{format(new Date(request.submitted_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Last Updated</p>
                  <p className="font-medium">{format(new Date(request.updated_date), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disbursement Modal */}
      <Dialog open={showDisbursementModal} onOpenChange={setShowDisbursementModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Disbursement</DialogTitle>
            <DialogDescription>
              Record the payment details for this approved request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  className="pl-9"
                  value={disbursementData.amount_paid}
                  onChange={(e) => setDisbursementData({ ...disbursementData, amount_paid: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={disbursementData.payment_method}
                onValueChange={(value) => setDisbursementData({ ...disbursementData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                  <SelectItem value="Campus Credit">Campus Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={disbursementData.notes}
                onChange={(e) => setDisbursementData({ ...disbursementData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt (Optional)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                <input
                  type="file"
                  className="hidden"
                  id="receiptUpload"
                  onChange={handleReceiptUpload}
                />
                <label htmlFor="receiptUpload" className="cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Click to upload receipt</p>
                </label>
                {disbursementData.receipt_upload && (
                  <p className="text-sm text-emerald-600 mt-2">✓ Receipt uploaded</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisbursementModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitDisbursement}
              disabled={!disbursementData.amount_paid || !disbursementData.payment_method || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}