import React, { useEffect, useState } from "react";
import { useOrganization } from "./OrganizationContext";
import LoadingSpinner from "./shared/LoadingSpinner";

// Import all pages
import PublicHome from "@/pages/PublicHome";
import Apply from "@/pages/Apply";
import Account from "@/pages/Profile";
import DashboardHome from "@/pages/DashboardHome";
import DashboardQueue from "@/pages/Queue";
import DashboardRequests from "@/pages/MyRequests";
import DashboardFunds from "@/pages/Funds";
import DashboardReports from "@/pages/Reports";
import DashboardRules from "@/pages/Rules";
import DashboardUsers from "@/pages/Users";
import DashboardAuditLog from "@/pages/AuditLog";
import DashboardReviewRequest from "@/pages/ReviewRequest";
import DashboardCreateFund from "@/pages/CreateFund";
import DashboardFundDetail from "@/pages/FundDetail";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import OrganizationDetail from "@/pages/OrganizationDetail";
import CreateOrganization from "@/pages/CreateOrganization";
import RequestDetail from "@/pages/RequestDetail";

export default function AppRouter() {
  const { organization, loading, isSuperAdmin } = useOrganization();
  const [currentRoute, setCurrentRoute] = useState(null);

  useEffect(() => {
    parseRoute();
    
    // Listen for navigation changes
    const handleNavigation = () => parseRoute();
    window.addEventListener('popstate', handleNavigation);
    
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [organization, isSuperAdmin]);

  const parseRoute = () => {
    const path = window.location.pathname;
    const search = window.location.search;
    const pathParts = path.split('/').filter(Boolean);

    // Super admin routes
    if (pathParts[0] === 'admin') {
      if (pathParts[1] === 'organizations' && pathParts[2] === 'new') {
        return setCurrentRoute({ page: 'CreateOrganization' });
      }
      if (pathParts[1] === 'organizations' && pathParts[2]) {
        return setCurrentRoute({ page: 'OrganizationDetail', params: search });
      }
      return setCurrentRoute({ page: 'SuperAdminDashboard' });
    }

    // Organization routes
    if (pathParts[0] && organization) {
      const subdomain = pathParts[0];
      
      // /{org}/dash/* - Staff dashboard routes
      if (pathParts[1] === 'dash') {
        const dashPage = pathParts[2] || 'home';
        const pageMap = {
          'home': 'DashboardHome',
          'queue': 'DashboardQueue',
          'requests': 'DashboardRequests',
          'funds': 'DashboardFunds',
          'reports': 'DashboardReports',
          'rules': 'DashboardRules',
          'users': 'DashboardUsers',
          'auditlog': 'DashboardAuditLog',
          'review': 'DashboardReviewRequest',
          'createfund': 'DashboardCreateFund',
          'funddetail': 'DashboardFundDetail',
        };
        
        return setCurrentRoute({ page: pageMap[dashPage] || 'DashboardHome', params: search });
      }
      
      // /{org}/account - Student account
      if (pathParts[1] === 'account') {
        return setCurrentRoute({ page: 'Account', params: search });
      }

      // /{org}/apply - Application
      if (pathParts[1] === 'apply') {
        return setCurrentRoute({ page: 'Apply', params: search });
      }

      // /{org}/request - Request detail
      if (pathParts[1] === 'request') {
        return setCurrentRoute({ page: 'RequestDetail', params: search });
      }
      
      // /{org} - Public home
      if (pathParts.length === 1) {
        return setCurrentRoute({ page: 'PublicHome' });
      }
    }

    // Default fallback
    setCurrentRoute({ page: 'PublicHome' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pageComponents = {
    PublicHome,
    Apply,
    Account,
    DashboardHome,
    DashboardQueue,
    DashboardRequests,
    DashboardFunds,
    DashboardReports,
    DashboardRules,
    DashboardUsers,
    DashboardAuditLog,
    DashboardReviewRequest,
    DashboardCreateFund,
    DashboardFundDetail,
    SuperAdminDashboard,
    OrganizationDetail,
    CreateOrganization,
    RequestDetail,
  };

  const PageComponent = pageComponents[currentRoute.page];
  
  if (!PageComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
          <p className="text-slate-600">The requested page does not exist.</p>
        </div>
      </div>
    );
  }

  return <PageComponent />;
}