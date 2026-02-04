import { useAuth } from "./AuthContext";

// Helper hook to get data filter for queries
export function useDataFilter() {
  const { user, isSuperAdmin } = useAuth();
  
  // Super admin sees all data
  if (isSuperAdmin) {
    return {};
  }
  
  // Organization users see only their org's data
  if (user?.organization_id) {
    return { organization_id: user.organization_id };
  }
  
  return null;
}

// Helper to add org_id to create operations
export function useDataWithOrg() {
  const { user } = useAuth();
  
  return (data) => {
    if (!user?.organization_id) return data;
    return { ...data, organization_id: user.organization_id };
  };
}