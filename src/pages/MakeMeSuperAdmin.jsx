import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function MakeMeSuperAdmin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOrgId = async () => {
    setProcessing(true);
    try {
      await base44.entities.User.update(user.id, { organization_id: null });
      setDone(true);
      setTimeout(() => {
        window.location.href = "/admin";
      }, 2000);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error removing organization ID");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">Success!</h2>
            <p className="text-green-700">You are now a Super Admin. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-20">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <CardTitle>Become Super Admin</CardTitle>
              <CardDescription>Remove organization association from your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">Warning</p>
              <p>This will remove your organization association and grant you platform-wide super admin access. You'll be able to manage all organizations.</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              <strong>Current User:</strong> {user?.full_name} ({user?.email})
            </p>
            <p className="text-sm text-slate-600">
              <strong>Current Organization ID:</strong> {user?.organization_id || "None"}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Current Role:</strong> {user?.staff_role || user?.role || "user"}
            </p>
          </div>

          <Button
            onClick={handleRemoveOrgId}
            disabled={processing || !user?.organization_id}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Remove Organization ID & Become Super Admin
              </>
            )}
          </Button>

          {!user?.organization_id && (
            <p className="text-sm text-green-600 text-center">
              You already have no organization ID (you may already be a super admin)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}