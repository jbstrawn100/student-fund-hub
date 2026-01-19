
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Removed useMutation as it was not used
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Edit
} from "lucide-react";
import { format } from "date-fns";

export default function RequestDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [response, setResponse] = useState("");
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

  const submitResponse = async () => {
    setSubmitting(true);

    // Add student response as a review
    await base44.entities.Review.create({
      fund_request_id: requestId,
      reviewer_user_id: user.id,
      reviewer_name: user.full_name,
      step_name: "Student Response",
      decision: "Pending",
      comments: response,
      decided_at: new Date().toISOString()
    });

    // Update request status back to In Review
    await base44.entities.FundRequest.update(requestId, {
      status: "In Review"
    });

    // Create audit log
    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: "STUDENT_RESPONSE",
      entity_type: "FundRequest",
      entity_id: requestId,
      details: JSON.stringify({ response })
    });

    queryClient.invalidateQueries(["fundRequest", requestId]);
    queryClient.invalidateQueries(["reviews", requestId]);
    setResponse("");
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
          <Link to={createPageUrl("MyRequests")}>Back to My Requests</Link>
        </Button>
      </div>
    );
  }

  const statusIcon = {
    Draft: Edit,
    Submitted: Clock,
    "In Review": Clock,
    "Needs Info": AlertCircle,
    Approved: CheckCircle,
    Denied: XCircle,
    Paid: CheckCircle,
    Closed: CheckCircle
  };
  const StatusIcon = statusIcon[request.status] || Clock;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl("MyRequests")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Header Card */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{request.fund_name}</h1>
              <p className="text-indigo-100 mt-1">{request.intended_use_category}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-indigo-100 text-sm">Requested Amount</p>
                <p className="text-2xl font-bold">${request.requested_amount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge status={request.status} className="text-base px-4 py-1" />
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                Submitted {request.submitted_at
                  ? format(new Date(request.submitted_at), "MMMM d, yyyy")
                  : format(new Date(request.created_date), "MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Details */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-2">Intended Use Description</p>
                <p className="text-slate-700 whitespace-pre-wrap">{request.intended_use_description}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Justification</p>
                <p className="text-slate-700 whitespace-pre-wrap">{request.justification_paragraph}</p>
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
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-slate-700 flex-1">Attachment {index + 1}</span>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
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
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const decisionColors = {
                      Approved: "text-emerald-600 bg-emerald-50",
                      Denied: "text-red-600 bg-red-50",
                      "Needs Info": "text-amber-600 bg-amber-50",
                      Pending: "text-blue-600 bg-blue-50"
                    };
                    return (
                      <div key={review.id} className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${decisionColors[review.decision] || "bg-slate-100"}`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-800">{review.reviewer_name}</span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(review.created_date), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mb-1">
                            {review.step_name} — <span className={decisionColors[review.decision]?.split(" ")[0]}>{review.decision}</span>
                          </p>
                          {review.comments && (
                            <p className="text-slate-700 bg-slate-50 p-3 rounded-lg mt-2">{review.comments}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Form (if Needs Info) */}
          {request.status === "Needs Info" && (
            <Card className="bg-amber-50/50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  Additional Information Requested
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="response">Your Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Provide the additional information requested..."
                    rows={4}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={submitResponse}
                  disabled={!response.trim() || submitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Response
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  request.status === "Approved" || request.status === "Paid"
                    ? "bg-emerald-100 text-emerald-600"
                    : request.status === "Denied"
                    ? "bg-red-100 text-red-600"
                    : request.status === "Needs Info"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-indigo-100 text-indigo-600"
                }`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{request.status}</p>
                  <p className="text-sm text-slate-500">
                    Updated {format(new Date(request.updated_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disbursement Info */}
          {disbursements.length > 0 && (
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-800">Disbursement</CardTitle>
              </CardHeader>
              <CardContent>
                {disbursements.map((d) => (
                  <div key={d.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Amount</span>
                      <span className="font-semibold">${d.amount_paid?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Method</span>
                      <span>{d.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date</span>
                      <span>{format(new Date(d.paid_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Applicant Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span>{request.student_full_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600">{request.student_email}</span>
              </div>
              {request.student_phone && (
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">{request.student_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
