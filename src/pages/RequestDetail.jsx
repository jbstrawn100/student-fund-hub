import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
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
  Edit,
  Hash,
  Mail,
  Phone,
  Tag,
  File,
  ChevronRight
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
      status: "In Review",
      locked: true
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

  const isStudent = user.id === request.student_user_id;
  const canRespond = isStudent && request.status === "Needs Info";

  // Status timeline configuration
  const timeline = [
    { 
      step: "Submitted", 
      icon: Send, 
      color: "indigo",
      completed: ["Submitted", "In Review", "Needs Info", "Approved", "Denied", "Paid", "Closed"].includes(request.status),
      active: request.status === "Submitted"
    },
    { 
      step: "In Review", 
      icon: Clock, 
      color: "amber",
      completed: ["In Review", "Needs Info", "Approved", "Denied", "Paid", "Closed"].includes(request.status),
      active: request.status === "In Review" || request.status === "Needs Info"
    },
    { 
      step: "Decision", 
      icon: request.status === "Approved" || request.status === "Paid" ? CheckCircle : request.status === "Denied" ? XCircle : AlertCircle, 
      color: request.status === "Approved" || request.status === "Paid" ? "emerald" : request.status === "Denied" ? "red" : "slate",
      completed: ["Approved", "Denied", "Paid", "Closed"].includes(request.status),
      active: request.status === "Approved" || request.status === "Denied"
    },
    { 
      step: "Disbursement", 
      icon: DollarSign, 
      color: "violet",
      completed: ["Paid", "Closed"].includes(request.status),
      active: request.status === "Paid"
    }
  ];

  const statusColorMap = {
    Draft: "bg-slate-50 border-slate-200",
    Submitted: "bg-blue-50 border-blue-200",
    "In Review": "bg-amber-50 border-amber-200",
    "Needs Info": "bg-orange-50 border-orange-200",
    Approved: "bg-emerald-50 border-emerald-200",
    Denied: "bg-red-50 border-red-200",
    Paid: "bg-violet-50 border-violet-200",
    Closed: "bg-slate-50 border-slate-200"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl("MyRequests")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Requests
          </Link>
        </Button>
      </div>

      {/* Header Card */}
      <Card className={`overflow-hidden border-2 ${statusColorMap[request.status]}`}>
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-indigo-100 text-sm mb-2">
                <Hash className="w-4 h-4" />
                <span className="font-mono">{request.request_id}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{request.fund_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-indigo-100">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Tag className="w-3 h-3 mr-1" />
                  {request.intended_use_category}
                </Badge>
                {request.submitted_at && (
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    Submitted {format(new Date(request.submitted_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-sm mb-1">Requested Amount</p>
              <p className="text-3xl md:text-4xl font-bold">${request.requested_amount?.toLocaleString()}</p>
              <div className="mt-3">
                <StatusBadge status={request.status} className="bg-white/90 text-slate-800 border-white" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Timeline */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="text-lg">Request Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{
                  width: `${(timeline.filter(t => t.completed).length / timeline.length) * 100}%`
                }}
              />
            </div>

            {/* Timeline Steps */}
            <div className="relative flex justify-between">
              {timeline.map((item, index) => {
                const Icon = item.icon;
                const colorClasses = {
                  indigo: "bg-indigo-600 text-white",
                  amber: "bg-amber-500 text-white",
                  emerald: "bg-emerald-600 text-white",
                  red: "bg-red-600 text-white",
                  violet: "bg-violet-600 text-white",
                  slate: "bg-slate-300 text-slate-600"
                };
                
                return (
                  <div key={index} className="flex flex-col items-center z-10">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        item.completed 
                          ? colorClasses[item.color]
                          : item.active 
                          ? "bg-white border-2 border-indigo-600 text-indigo-600 animate-pulse"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`mt-2 text-xs md:text-sm font-medium text-center ${
                      item.completed || item.active ? "text-slate-800" : "text-slate-400"
                    }`}>
                      {item.step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status Message */}
          {request.status === "Needs Info" && (
            <Alert className="mt-6 bg-orange-50 border-orange-200">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                The reviewer has requested additional information. Please provide the details below.
              </AlertDescription>
            </Alert>
          )}
          {request.status === "Approved" && (
            <Alert className="mt-6 bg-emerald-50 border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                Your request has been approved! Payment processing will begin shortly.
              </AlertDescription>
            </Alert>
          )}
          {request.status === "Paid" && (
            <Alert className="mt-6 bg-violet-50 border-violet-200">
              <CheckCircle className="w-4 h-4 text-violet-600" />
              <AlertDescription className="text-violet-900">
                Payment has been disbursed. Check the disbursement details below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Details */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Info */}
              <div className="grid md:grid-cols-3 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Full Name
                  </p>
                  <p className="font-medium">{request.student_full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="font-medium text-sm">{request.student_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium">{request.student_phone || "Not provided"}</p>
                </div>
              </div>

              {/* Use Description */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">How will you use these funds?</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-800 whitespace-pre-wrap">{request.intended_use_description}</p>
                </div>
              </div>

              {/* Justification */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Why do you deserve these funds?</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-800 whitespace-pre-wrap">{request.justification_paragraph}</p>
                </div>
              </div>

              {/* Attachments */}
              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Supporting Documents ({request.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {request.attachments.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
                      >
                        <File className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <span className="text-sm text-indigo-700 flex-1 font-medium truncate">
                          {file.name}
                        </span>
                        <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
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
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">No activity yet</p>
                  <p className="text-sm text-slate-400 mt-1">Updates will appear here as your request is reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, idx) => {
                    const decisionColors = {
                      Approved: "bg-emerald-50 border-emerald-200 text-emerald-800",
                      Denied: "bg-red-50 border-red-200 text-red-800",
                      "Needs Info": "bg-amber-50 border-amber-200 text-amber-800",
                      Pending: "bg-blue-50 border-blue-200 text-blue-800"
                    };
                    
                    const DecisionIcon = review.decision === "Approved" ? CheckCircle
                                       : review.decision === "Denied" ? XCircle
                                       : review.decision === "Needs Info" ? AlertCircle
                                       : MessageSquare;
                    
                    return (
                      <div key={review.id}>
                        <div className={`p-4 rounded-xl border-2 ${decisionColors[review.decision] || "bg-slate-50 border-slate-200"}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                              <DecisionIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-semibold">{review.reviewer_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {review.step_name}
                                </Badge>
                                <span className="text-xs opacity-60">
                                  {format(new Date(review.created_date), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="font-medium text-sm mb-2">
                                {review.decision}
                              </p>
                              {review.comments && (
                                <div className="bg-white/70 p-3 rounded-lg mt-2">
                                  <p className="text-sm">{review.comments}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {idx < reviews.length - 1 && (
                          <div className="flex justify-center my-2">
                            <ChevronRight className="w-5 h-5 text-slate-300 rotate-90" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Form (if Needs Info) */}
          {canRespond && (
            <Card className="bg-orange-50/80 border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                  <AlertCircle className="w-5 h-5" />
                  Response Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-orange-800">
                  The reviewer has requested additional information. Please provide your response below to continue the review process.
                </p>
                <div>
                  <Label htmlFor="response" className="text-orange-900">Your Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Provide the additional information requested by the reviewer..."
                    rows={5}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="mt-2 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <Button
                  onClick={submitResponse}
                  disabled={!response.trim() || submitting}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Response
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg">Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-slate-500">Request ID</span>
                <span className="font-mono font-medium text-indigo-600">{request.request_id}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={request.status} />
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-slate-500">Category</span>
                <span className="font-medium">{request.intended_use_category}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-slate-500">Created</span>
                <span className="font-medium">{format(new Date(request.created_date), "MMM d, yyyy")}</span>
              </div>
              {request.submitted_at && (
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-slate-500">Submitted</span>
                  <span className="font-medium">{format(new Date(request.submitted_at), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-medium">{format(new Date(request.updated_date), "MMM d, yyyy")}</span>
              </div>
              {request.locked && (
                <Alert className="bg-blue-50 border-blue-200 mt-4">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs">
                    This request is locked and cannot be edited.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Disbursement Info */}
          {disbursements.length > 0 && (
            <Card className="bg-violet-50/80 border-2 border-violet-200">
              <CardHeader>
                <CardTitle className="text-lg text-violet-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Payment Disbursed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disbursements.map((d) => (
                  <div key={d.id} className="space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-3 border-b border-violet-200">
                      <span className="text-violet-700">Amount Paid</span>
                      <span className="font-bold text-lg text-violet-800">
                        ${d.amount_paid?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-violet-700">Payment Method</span>
                      <span className="font-medium text-violet-900">{d.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-violet-700">Date Paid</span>
                      <span className="font-medium text-violet-900">
                        {format(new Date(d.paid_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {d.notes && (
                      <div className="pt-3 border-t border-violet-200">
                        <p className="text-violet-700 mb-1">Notes</p>
                        <p className="text-violet-900">{d.notes}</p>
                      </div>
                    )}
                    {d.receipt_upload && (
                      <a
                        href={d.receipt_upload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-violet-600 hover:text-violet-800 pt-3 border-t border-violet-200"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">View Receipt</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}