import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndOrg();
  }, []);

  const loadUserAndOrg = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load organization if user has one
      if (currentUser.organization_id) {
        const orgs = await base44.entities.Organization.filter({ id: currentUser.organization_id });
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user && !user.organization_id;
  const isOrgAdmin = user?.staff_role === "admin";
  const isStaff = user && ["reviewer", "approver", "fund_manager", "admin"].includes(user.staff_role);

  return (
    <AuthContext.Provider value={{ 
      user, 
      organization, 
      loading, 
      isSuperAdmin, 
      isOrgAdmin,
      isStaff,
      refreshUser: loadUserAndOrg 
    }}>
      {children}
    </AuthContext.Provider>
  );
}