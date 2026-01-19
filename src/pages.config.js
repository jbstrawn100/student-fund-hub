import Home from './pages/Home';
import Apply from './pages/Apply';
import MyRequests from './pages/MyRequests';
import RequestDetail from './pages/RequestDetail';
import Queue from './pages/Queue';
import ReviewRequest from './pages/ReviewRequest';
import Funds from './pages/Funds';
import Rules from './pages/Rules';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Apply": Apply,
    "MyRequests": MyRequests,
    "RequestDetail": RequestDetail,
    "Queue": Queue,
    "ReviewRequest": ReviewRequest,
    "Funds": Funds,
    "Rules": Rules,
    "Users": Users,
    "Reports": Reports,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};