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
import CreateFund from './pages/CreateFund';
import FundDetail from './pages/FundDetail';
import Funds from './pages/Funds';
import Home from './pages/Home';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import Queue from './pages/Queue';
import Reports from './pages/Reports';
import RequestDetail from './pages/RequestDetail';
import ReviewRequest from './pages/ReviewRequest';
import Rules from './pages/Rules';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import AuditLog from './pages/AuditLog';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CreateOrganization from './pages/CreateOrganization';
import OrganizationDetail from './pages/OrganizationDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Apply": Apply,
    "CreateFund": CreateFund,
    "FundDetail": FundDetail,
    "Funds": Funds,
    "Home": Home,
    "MyRequests": MyRequests,
    "Profile": Profile,
    "Queue": Queue,
    "Reports": Reports,
    "RequestDetail": RequestDetail,
    "ReviewRequest": ReviewRequest,
    "Rules": Rules,
    "Users": Users,
    "Notifications": Notifications,
    "AuditLog": AuditLog,
    "SuperAdminDashboard": SuperAdminDashboard,
    "CreateOrganization": CreateOrganization,
    "OrganizationDetail": OrganizationDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};