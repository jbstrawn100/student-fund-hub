import { useOrganization } from "./OrganizationContext";

// Helper hook to get organization filter for queries
export function useOrgFilter() {
  const { organization, isSuperAdmin } = useOrganization();
  
  // Super admin viewing a specific organization - filter by that org
  if (isSuperAdmin && organization) {
    return { organization_id: organization.id };
  }
  
  // Super admin not viewing any specific organization - see all data
  if (isSuperAdmin) {
    return {};
  }
  
  // Organization users can only see their org's data
  return organization ? { organization_id: organization.id } : null;
}

// Helper to add org_id to create operations
export function useOrgData() {
  const { organization } = useOrganization();
  
  return (data) => {
    if (!organization) return data;
    return { ...data, organization_id: organization.id };
  };
}

// Returns the organization prefix for URLs
export function useOrgPrefix() {
  const { organization, isSuperAdmin } = useOrganization();
  
  if (isSuperAdmin || !organization) return "";
  return `/${organization.subdomain}`;
}