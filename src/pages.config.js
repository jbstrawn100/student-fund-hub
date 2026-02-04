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
import Apply from './pages/Apply';
import AuditLog from './pages/AuditLog';
import CreateFund from './pages/CreateFund';
import CreateOrganization from './pages/CreateOrganization';
import FundDetail from './pages/FundDetail';
import Funds from './pages/Funds';
import Home from './pages/Home';
import MyRequests from './pages/MyRequests';
import Notifications from './pages/Notifications';
import OrganizationDetail from './pages/OrganizationDetail';
import Profile from './pages/Profile';
import Queue from './pages/Queue';
import Reports from './pages/Reports';
import RequestDetail from './pages/RequestDetail';
import ReviewRequest from './pages/ReviewRequest';
import Rules from './pages/Rules';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLayout from './pages/SuperAdminLayout';
import Users from './pages/Users';
import PublicHome from './pages/PublicHome';
import DashboardHome from './pages/DashboardHome';
import DashboardQueue from './pages/DashboardQueue';
import DashboardRequests from './pages/DashboardRequests';
import DashboardFunds from './pages/DashboardFunds';
import DashboardReports from './pages/DashboardReports';
import DashboardRules from './pages/DashboardRules';
import DashboardUsers from './pages/DashboardUsers';
import DashboardAuditLog from './pages/DashboardAuditLog';
import DashboardReviewRequest from './pages/DashboardReviewRequest';
import DashboardCreateFund from './pages/DashboardCreateFund';
import DashboardFundDetail from './pages/DashboardFundDetail';
import Account from './pages/Account';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Apply": Apply,
    "AuditLog": AuditLog,
    "CreateFund": CreateFund,
    "CreateOrganization": CreateOrganization,
    "FundDetail": FundDetail,
    "Funds": Funds,
    "Home": Home,
    "MyRequests": MyRequests,
    "Notifications": Notifications,
    "OrganizationDetail": OrganizationDetail,
    "Profile": Profile,
    "Queue": Queue,
    "Reports": Reports,
    "RequestDetail": RequestDetail,
    "ReviewRequest": ReviewRequest,
    "Rules": Rules,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminLayout": SuperAdminLayout,
    "Users": Users,
    "PublicHome": PublicHome,
    "DashboardHome": DashboardHome,
    "DashboardQueue": DashboardQueue,
    "DashboardRequests": DashboardRequests,
    "DashboardFunds": DashboardFunds,
    "DashboardReports": DashboardReports,
    "DashboardRules": DashboardRules,
    "DashboardUsers": DashboardUsers,
    "DashboardAuditLog": DashboardAuditLog,
    "DashboardReviewRequest": DashboardReviewRequest,
    "DashboardCreateFund": DashboardCreateFund,
    "DashboardFundDetail": DashboardFundDetail,
    "Account": Account,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};