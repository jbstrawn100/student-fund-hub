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
      // Check URL path for organization
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(Boolean);
      
      // If path is /admin, it's super admin mode
      if (pathParts[0] === 'admin') {
        try {
          const user = await base44.auth.me();
          setIsSuperAdmin(!user.organization_id);
        } catch (err) {
          setIsSuperAdmin(false);
        }
        return;
      }
      
      // If path starts with /{subdomain}, load that organization
      if (pathParts[0]) {
        const subdomain = pathParts[0];
        
        // Fetch organization by subdomain
        const orgs = await base44.entities.Organization.filter({ subdomain });
        
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
          
          // Check if user is super admin (no organization_id on user record)
          try {
            const user = await base44.auth.me();
            setIsSuperAdmin(!user.organization_id);
          } catch (err) {
            setIsSuperAdmin(false);
          }
        }
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