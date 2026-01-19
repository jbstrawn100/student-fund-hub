import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Settings,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  User,
  Users
} from "lucide-react";

export default function Rules() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    step_name: "",
    reviewer_role: "",
    assigned_user_id: "",
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: funds = [] } = useQuery({
    queryKey: ["allFunds"],
    queryFn: () => base44.entities.Fund.list(),
  });

  const { data: allRules = [], isLoading } = useQuery({
    queryKey: ["routingRules"],
    queryFn: () => base44.entities.RoutingRule.list("step_order"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const rules = selectedFundId
    ? allRules.filter(r => r.fund_id === selectedFundId)
    : allRules;

  const selectedFund = funds.find(f => f.id === selectedFundId);
  const staffUsers = users.filter(u => 
    ["reviewer", "approver", "fund_manager", "admin"].includes(u.app_role)
  );

  const openCreateModal = () => {
    if (!selectedFundId) {
      alert("Please select a fund first");
      return;
    }
    setEditingRule(null);
    setFormData({
      step_name: "",
      reviewer_role: "",
      assigned_user_id: "",
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      step_name: rule.step_name,
      reviewer_role: rule.reviewer_role,
      assigned_user_id: rule.assigned_user_id || "",
      is_active: rule.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const assignedUser = staffUsers.find(u => u.id === formData.assigned_user_id);
    
    const ruleData = {
      fund_id: selectedFundId,
      fund_name: selectedFund?.fund_name,
      step_name: formData.step_name,
      reviewer_role: formData.reviewer_role,
      assigned_user_id: formData.assigned_user_id || null,
      assigned_user_name: assignedUser?.full_name || null,
      is_active: formData.is_active,
      step_order: editingRule 
        ? editingRule.step_order 
        : rules.length + 1
    };

    if (editingRule) {
      await base44.entities.RoutingRule.update(editingRule.id, ruleData);
    } else {
      await base44.entities.RoutingRule.create(ruleData);
    }

    queryClient.invalidateQueries(["routingRules"]);
    setShowModal(false);
    setSubmitting(false);
  };

  const handleDelete = async (rule) => {
    if (!confirm("Are you sure you want to delete this routing rule?")) return;
    await base44.entities.RoutingRule.delete(rule.id);
    queryClient.invalidateQueries(["routingRules"]);
  };

  const handleToggleActive = async (rule) => {
    await base44.entities.RoutingRule.update(rule.id, { is_active: !rule.is_active });
    queryClient.invalidateQueries(["routingRules"]);
  };

  const moveRule = async (rule, direction) => {
    const fundRules = rules.filter(r => r.fund_id === rule.fund_id).sort((a, b) => a.step_order - b.step_order);
    const currentIndex = fundRules.findIndex(r => r.id === rule.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= fundRules.length) return;

    const targetRule = fundRules[targetIndex];
    
    await Promise.all([
      base44.entities.RoutingRule.update(rule.id, { step_order: targetRule.step_order }),
      base44.entities.RoutingRule.update(targetRule.id, { step_order: rule.step_order })
    ]);

    queryClient.invalidateQueries(["routingRules"]);
  };

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
        title="Routing Rules"
        description="Configure approval workflows for each fund"
      />

      {/* Fund Selector */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a fund to manage rules..." />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.fund_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={openCreateModal} 
              disabled={!selectedFundId}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      {!selectedFundId ? (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardContent className="py-16">
            <EmptyState
              icon={Settings}
              title="Select a Fund"
              description="Choose a fund above to view and manage its routing rules"
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : rules.length === 0 ? (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardContent className="py-16">
            <EmptyState
              icon={Settings}
              title="No Routing Rules"
              description="Add workflow steps to define how requests are reviewed and approved"
              action={
                <Button onClick={openCreateModal} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Step
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle>Workflow Steps for {selectedFund?.fund_name}</CardTitle>
            <CardDescription>
              Requests will be routed through these steps in order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rules
                .sort((a, b) => a.step_order - b.step_order)
                .map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      rule.is_active 
                        ? "bg-white border-slate-200" 
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled={index === 0}
                        onClick={() => moveRule(rule, "up")}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled={index === rules.length - 1}
                        onClick={() => moveRule(rule, "down")}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800">{rule.step_name}</h4>
                        {!rule.is_active && (
                          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="capitalize">{rule.reviewer_role}</span>
                        </div>
                        {rule.assigned_user_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{rule.assigned_user_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(rule)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(rule)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Routing Step" : "Add Routing Step"}</DialogTitle>
            <DialogDescription>
              Configure who should review requests at this step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Step Name *</Label>
              <Input
                value={formData.step_name}
                onChange={(e) => setFormData({ ...formData, step_name: e.target.value })}
                placeholder="e.g., Initial Review, Final Approval"
              />
            </div>
            <div className="space-y-2">
              <Label>Reviewer Role *</Label>
              <Select
                value={formData.reviewer_role}
                onValueChange={(value) => setFormData({ ...formData, reviewer_role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                  <SelectItem value="fund_manager">Fund Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign to Specific User (Optional)</Label>
              <Select
                value={formData.assigned_user_id}
                onValueChange={(value) => setFormData({ ...formData, assigned_user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any user with this role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any user with this role</SelectItem>
                  {staffUsers
                    .filter(u => !formData.reviewer_role || u.app_role === formData.reviewer_role)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.step_name || !formData.reviewer_role || submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {editingRule ? "Save Changes" : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}