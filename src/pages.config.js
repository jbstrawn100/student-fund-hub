/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Account from './pages/Account';
import Admin from './pages/Admin';
import Apply from './pages/Apply';
import CreateOrganization from './pages/CreateOrganization';
import DashboardAuditLog from './pages/DashboardAuditLog';
import DashboardCreateFund from './pages/DashboardCreateFund';
import DashboardFundDetail from './pages/DashboardFundDetail';
import DashboardFunds from './pages/DashboardFunds';
import DashboardHome from './pages/DashboardHome';
import DashboardQueue from './pages/DashboardQueue';
import DashboardReports from './pages/DashboardReports';
import DashboardRequests from './pages/DashboardRequests';
import DashboardReviewRequest from './pages/DashboardReviewRequest';
import DashboardRules from './pages/DashboardRules';
import DashboardUsers from './pages/DashboardUsers';
import FundDetail from './pages/FundDetail';
import Home from './pages/Home';
import MakeMeSuperAdmin from './pages/MakeMeSuperAdmin';
import MyRequests from './pages/MyRequests';
import Notifications from './pages/Notifications';
import OrganizationDetail from './pages/OrganizationDetail';
import Profile from './pages/Profile';
import PublicHome from './pages/PublicHome';
import RequestDetail from './pages/RequestDetail';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLayout from './pages/SuperAdminLayout';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "Admin": Admin,
    "Apply": Apply,
    "CreateOrganization": CreateOrganization,
    "DashboardAuditLog": DashboardAuditLog,
    "DashboardCreateFund": DashboardCreateFund,
    "DashboardFundDetail": DashboardFundDetail,
    "DashboardFunds": DashboardFunds,
    "DashboardHome": DashboardHome,
    "DashboardQueue": DashboardQueue,
    "DashboardReports": DashboardReports,
    "DashboardRequests": DashboardRequests,
    "DashboardReviewRequest": DashboardReviewRequest,
    "DashboardRules": DashboardRules,
    "DashboardUsers": DashboardUsers,
    "FundDetail": FundDetail,
    "Home": Home,
    "MakeMeSuperAdmin": MakeMeSuperAdmin,
    "MyRequests": MyRequests,
    "Notifications": Notifications,
    "OrganizationDetail": OrganizationDetail,
    "Profile": Profile,
    "PublicHome": PublicHome,
    "RequestDetail": RequestDetail,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminLayout": SuperAdminLayout,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};