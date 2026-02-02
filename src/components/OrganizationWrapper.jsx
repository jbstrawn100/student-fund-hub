import React from "react";
import { OrganizationProvider, useOrganization } from "./OrganizationContext";
import LoadingSpinner from "./shared/LoadingSpinner";

function OrganizationChecker({ children }) {
  const { organization, loading, isSuperAdmin } = useOrganization();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Super admin can access without organization
  if (isSuperAdmin) {
    return children;
  }

  // Organization users must have a valid organization
  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Organization Not Found</h1>
          <p className="text-slate-600">
            This subdomain is not configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Check if organization is active (but allow super admins to view inactive orgs)
  if (organization.status !== "active" && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Organization Suspended</h1>
          <p className="text-slate-600">
            This organization is currently {organization.status}. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default function OrganizationWrapper({ children }) {
  return (
    <OrganizationProvider>
      <OrganizationChecker>{children}</OrganizationChecker>
    </OrganizationProvider>
  );
}