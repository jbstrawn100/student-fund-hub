import { useOrganization } from "./OrganizationContext";

// Helper hook to get organization filter for queries
export function useOrgFilter() {
  const { organization, isSuperAdmin } = useOrganization();
  
  // Super admin can see all data (no filter)
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