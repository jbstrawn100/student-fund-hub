import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  Search,
  MoreHorizontal,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function Funds() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [formData, setFormData] = useState({
    fund_name: "",
    description: "",
    eligibility_notes: "",
    start_date: "",
    end_date: "",
    total_budget: "",
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

  const { data: funds = [], isLoading } = useQuery({
    queryKey: ["allFunds"],
    queryFn: () => base44.entities.Fund.list("-created_date"),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["allRequests"],
    queryFn: () => base44.entities.FundRequest.list(),
  });

  const filteredFunds = funds.filter((fund) =>
    fund.fund_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRequestCount = (fundId) => {
    return requests.filter(r => r.fund_id === fundId).length;
  };

  const getTotalDisbursed = (fundId) => {
    const fund = funds.find(f => f.id === fundId);
    if (!fund) return 0;
    return (fund.total_budget || 0) - (fund.remaining_budget || fund.total_budget || 0);
  };

  const openCreateModal = () => {
    setEditingFund(null);
    setFormData({
      fund_name: "",
      description: "",
      eligibility_notes: "",
      start_date: "",
      end_date: "",
      total_budget: "",
      status: "active"
    });
    setShowModal(true);
  };

  const openEditModal = (fund) => {
    setEditingFund(fund);
    setFormData({
      fund_name: fund.fund_name,
      description: fund.description || "",
      eligibility_notes: fund.eligibility_notes || "",
      start_date: fund.start_date || "",
      end_date: fund.end_date || "",
      total_budget: fund.total_budget?.toString() || "",
      status: fund.status
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const fundData = {
      fund_name: formData.fund_name,
      description: formData.description,
      eligibility_notes: formData.eligibility_notes,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      total_budget: parseFloat(formData.total_budget),
      remaining_budget: editingFund 
        ? editingFund.remaining_budget 
        : parseFloat(formData.total_budget),
      status: formData.status,
      fund_owner_id: user.id,
      fund_owner_name: user.full_name
    };

    if (editingFund) {
      await base44.entities.Fund.update(editingFund.id, fundData);
    } else {
      await base44.entities.Fund.create(fundData);
    }

    // Create audit log
    await base44.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name,
      action_type: editingFund ? "FUND_UPDATED" : "FUND_CREATED",
      entity_type: "Fund",
      entity_id: editingFund?.id || "new",
      details: JSON.stringify({ fund_name: formData.fund_name })
    });

    queryClient.invalidateQueries(["allFunds"]);
    setShowModal(false);
    setSubmitting(false);
  };

  const handleStatusChange = async (fund, newStatus) => {
    await base44.entities.Fund.update(fund.id, { status: newStatus });
    queryClient.invalidateQueries(["allFunds"]);
  };

  const handleDelete = async (fund) => {
    if (!confirm(`Are you sure you want to delete "${fund.fund_name}"? This action cannot be undone.`)) {
      return;
    }
    await base44.entities.Fund.delete(fund.id);
    queryClient.invalidateQueries(["allFunds"]);
  };

  const canManageFunds = user?.app_role === "fund_manager" || user?.app_role === "admin";

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Management"
        description="Create and manage funds for student assistance"
        actions={
          canManageFunds && (
            <Button onClick={openCreateModal} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Fund
            </Button>
          )
        }
      />

      {/* Search */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search funds..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Funds Grid/Table */}
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : filteredFunds.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No Funds Found"
          description={funds.length === 0 ? "Create your first fund to get started." : "No funds match your search."}
          action={
            funds.length === 0 && canManageFunds && (
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Fund
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4">
            {filteredFunds.map((fund) => (
              <Card key={fund.id} className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{fund.fund_name}</CardTitle>
                      <CardDescription className="mt-1">{fund.description}</CardDescription>
                    </div>
                    <StatusBadge status={fund.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Budget</p>
                      <p className="font-semibold">${fund.total_budget?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Remaining</p>
                      <p className="font-semibold text-emerald-600">
                        ${(fund.remaining_budget || fund.total_budget)?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Requests</p>
                      <p className="font-semibold">{getRequestCount(fund.id)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Disbursed</p>
                      <p className="font-semibold">${getTotalDisbursed(fund.id).toLocaleString()}</p>
                    </div>
                  </div>
                  {canManageFunds && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(fund)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {fund.status !== "active" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(fund, "active")}>
                              Activate
                            </DropdownMenuItem>
                          )}
                          {fund.status === "active" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(fund, "inactive")}>
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleStatusChange(fund, "archived")}>
                            <Archive className="w-4 h-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(fund)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table */}
          <Card className="hidden md:block bg-white/70 backdrop-blur-sm border-slate-200/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  {canManageFunds && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunds.map((fund) => (
                  <TableRow key={fund.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold">{fund.fund_name}</p>
                        {fund.description && (
                          <p className="text-sm text-slate-500 line-clamp-1">{fund.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${fund.total_budget?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-emerald-600 font-medium">
                        ${(fund.remaining_budget || fund.total_budget)?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-400" />
                        {getRequestCount(fund.id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={fund.status} />
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {fund.start_date && fund.end_date ? (
                        <>
                          {format(new Date(fund.start_date), "MMM d")} - {format(new Date(fund.end_date), "MMM d, yyyy")}
                        </>
                      ) : fund.end_date ? (
                        <>Ends {format(new Date(fund.end_date), "MMM d, yyyy")}</>
                      ) : (
                        "No dates set"
                      )}
                    </TableCell>
                    {canManageFunds && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(fund)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {fund.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(fund, "active")}>
                                Activate
                              </DropdownMenuItem>
                            )}
                            {fund.status === "active" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(fund, "inactive")}>
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleStatusChange(fund, "archived")}>
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(fund)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFund ? "Edit Fund" : "Create New Fund"}</DialogTitle>
            <DialogDescription>
              {editingFund ? "Update the fund details below." : "Set up a new fund for student assistance."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fund Name *</Label>
              <Input
                value={formData.fund_name}
                onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
                placeholder="e.g., Emergency Assistance Fund"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this fund..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Eligibility Notes</Label>
              <Textarea
                value={formData.eligibility_notes}
                onChange={(e) => setFormData({ ...formData, eligibility_notes: e.target.value })}
                placeholder="Any eligibility requirements..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Budget *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    className="pl-9"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                    placeholder="0.00"
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
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.fund_name || !formData.total_budget || submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {editingFund ? "Save Changes" : "Create Fund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}