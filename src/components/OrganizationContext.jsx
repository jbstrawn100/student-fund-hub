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

  useEffect(() => {
    // Reload organization when path changes
    const handlePathChange = () => {
      loadOrganization();
    };
    
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const loadOrganization = async () => {
    try {
      // Check URL path for organization
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(Boolean);
      
      // If path is /admin or starts with admin, it's super admin mode
      if (pathParts[0] === 'admin' || path.toLowerCase().includes('admin')) {
        try {
          const user = await base44.auth.me();
          setIsSuperAdmin(!user.organization_id);
          setOrganization(null); // No organization in super admin mode
        } catch (err) {
          setIsSuperAdmin(false);
        }
        setLoading(false);
        return;
      }
      
      // Try to load organization from URL path first
      if (pathParts[0]) {
        const subdomain = pathParts[0];
        
        // Fetch organization by subdomain
        const orgs = await base44.entities.Organization.filter({ subdomain });
        
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
          
          // Check if user is super admin
          try {
            const user = await base44.auth.me();
            setIsSuperAdmin(!user.organization_id);
          } catch (err) {
            setIsSuperAdmin(false);
          }
          setLoading(false);
          return;
        }
      }
      
      // If no org from URL, try to load from user's organization_id
      try {
        const user = await base44.auth.me();
        if (user.organization_id) {
          const org = await base44.entities.Organization.filter({ id: user.organization_id });
          if (org.length > 0) {
            setOrganization(org[0]);
          }
        } else {
          // No organization_id means super admin
          setIsSuperAdmin(true);
        }
      } catch (err) {
        console.error("Error loading user organization:", err);
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