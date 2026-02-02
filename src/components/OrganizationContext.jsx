import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const OrganizationContext = createContext(null);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}

export function OrganizationProvider({ children }) {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      // Check if this is super admin dashboard
      const hostname = window.location.hostname;
      const isSuperAdminDomain = hostname === 'localhost' || hostname.startsWith('app.') || !hostname.includes('.');
      
      if (isSuperAdminDomain) {
        // Super admin - no specific organization
        setIsSuperAdmin(true);
        setLoading(false);
        return;
      }

      // Extract subdomain
      const subdomain = hostname.split('.')[0];
      
      // Fetch organization by subdomain
      const orgs = await base44.entities.Organization.filter({ subdomain });
      
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
      } else {
        console.error("Organization not found for subdomain:", subdomain);
      }
    } catch (error) {
      console.error("Error loading organization:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrganizationContext.Provider value={{ organization, loading, isSuperAdmin, setOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}